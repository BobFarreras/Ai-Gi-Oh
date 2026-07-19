-- docs/supabase/sql/136_skill_tree_foundation.sql
-- Ficha 8 — Maquinaria del árbol de habilidades del Operador (catálogo + rangos del jugador + RPC de subida).
--
-- NOTA DE ORDEN: son TABLAS NUEVAS sin código vivo que las escriba, así que —al revés que la 135— se puede
-- aplicar en cualquier momento sin romper nada. El contenido del árbol (filas de character_skill_nodes) va en
-- una migración/seed aparte (137), para tunearlo sin tocar esta maquinaria.
--
-- Modelo de seguridad (mismo candado que la cartera / credit_passive_nexus):
--   · character_skill_nodes  → lectura pública (authenticated), escritura solo service_role (admin).
--   · player_skill_ranks     → el jugador LEE su fila; solo la RPC (service_role) la escribe.
--   · rank_up_skill_node      → security definer, EXECUTE solo service_role. Un server route resuelve la sesión
--     (auth.uid()) y le pasa p_player_id + p_available_points (calculados en el servidor desde player_experience,
--     ya blindado por la 135, con la curva ÚNICA de resolvePlayerLevel — así NO se duplica la curva en SQL).
--   · La RPC valida ATÓMICAMENTE: gate por rango, tope max_rank, puntos gastados <= disponibles. Idempotente
--     por operación (una subida = una operación; el reintento de red no dobla el rango).
begin;

-- ── 1) Catálogo de nodos (data-driven; editable solo admin/service_role) ───────────────────────────────
create table if not exists public.character_skill_nodes (
  id            text primary key,
  branch        text not null check (branch in ('ROOT', 'ECONOMY', 'COMBAT', 'ARSENAL')),
  tier          integer not null,
  max_rank      integer not null check (max_rank >= 1),
  cost_per_rank integer not null check (cost_per_rank >= 1),
  effect        jsonb   not null,                       -- { kind, valuePerRank | value | ... }
  prerequisites jsonb   not null default '[]'::jsonb,   -- [{ "nodeId": "...", "minRank": N }]
  display       jsonb   not null default '{}'::jsonb,   -- { name, blurb, icon, x, y }
  is_active     boolean not null default true
);

-- ── 2) Rango del jugador por nodo (0 = no lo tiene; se sube de 1 en 1 vía RPC) ─────────────────────────
create table if not exists public.player_skill_ranks (
  player_id  uuid    not null references auth.users (id) on delete cascade,
  node_id    text    not null references public.character_skill_nodes (id),
  rank       integer not null check (rank >= 1),
  updated_at timestamptz not null default now(),
  primary key (player_id, node_id)
);

-- ── 3) Idempotencia de la subida (una operación = un intento de +1 rango) ──────────────────────────────
create table if not exists public.skill_rank_operations (
  operation_id uuid primary key,
  player_id    uuid not null references auth.users (id) on delete cascade,
  node_id      text not null,
  created_at   timestamptz not null default now()
);

-- ── 4) RPC de subida de rango: valida y aplica en una transacción ──────────────────────────────────────
create or replace function public.rank_up_skill_node(
  p_player_id        uuid,
  p_node_id          text,
  p_available_points integer,
  p_operation_id     uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_node    public.character_skill_nodes%rowtype;
  v_current integer;
  v_spent   integer;
  v_prereq  jsonb;
  v_ok      boolean;
begin
  if p_player_id is null or p_node_id is null or p_operation_id is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_args');
  end if;

  -- Nodo válido y activo.
  select * into v_node from public.character_skill_nodes where id = p_node_id and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_node');
  end if;

  -- Rango actual (0 si no lo tiene). FOR UPDATE serializa el doble clic / dos subidas simultáneas.
  select rank into v_current
    from public.player_skill_ranks
   where player_id = p_player_id and node_id = p_node_id
   for update;
  v_current := coalesce(v_current, 0);

  if v_current >= v_node.max_rank then
    return jsonb_build_object('ok', false, 'reason', 'max_rank', 'rank', v_current);
  end if;

  -- Gate POR RANGO: cada { nodeId, minRank } debe cumplirse con el rango actual del prerequisito.
  for v_prereq in select * from jsonb_array_elements(v_node.prerequisites)
  loop
    select exists(
      select 1 from public.player_skill_ranks
       where player_id = p_player_id
         and node_id = (v_prereq ->> 'nodeId')
         and rank >= (v_prereq ->> 'minRank')::integer
    ) into v_ok;
    if not v_ok then
      return jsonb_build_object('ok', false, 'reason', 'prereq_unmet', 'missing', v_prereq);
    end if;
  end loop;

  -- Puntos: gastado actual + coste del siguiente rango <= disponibles (server los deriva de la XP blindada).
  select coalesce(sum(n.cost_per_rank * r.rank), 0) into v_spent
    from public.player_skill_ranks r
    join public.character_skill_nodes n on n.id = r.node_id
   where r.player_id = p_player_id;

  if v_spent + v_node.cost_per_rank > coalesce(p_available_points, 0) then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_points',
                              'spent', v_spent, 'available', coalesce(p_available_points, 0));
  end if;

  -- Idempotencia: se registra la operación JUSTO antes de aplicar (un intento fallido NO consume el id → se
  -- puede reintentar tras ganar puntos/prereqs). Si ya existía, la subida ya se hizo → no doblar.
  insert into public.skill_rank_operations (operation_id, player_id, node_id)
  values (p_operation_id, p_player_id, p_node_id)
  on conflict (operation_id) do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true, 'node_id', p_node_id, 'rank', v_current);
  end if;

  -- Aplicar el +1.
  insert into public.player_skill_ranks (player_id, node_id, rank)
  values (p_player_id, p_node_id, v_current + 1)
  on conflict (player_id, node_id) do update
    set rank = public.player_skill_ranks.rank + 1, updated_at = now();

  return jsonb_build_object('ok', true, 'node_id', p_node_id, 'rank', v_current + 1,
                            'points_spent', v_spent + v_node.cost_per_rank,
                            'points_available', coalesce(p_available_points, 0));
end;
$$;

-- ── 5) RLS y permisos ──────────────────────────────────────────────────────────────────────────────────
alter table public.character_skill_nodes enable row level security;
alter table public.player_skill_ranks    enable row level security;
alter table public.skill_rank_operations enable row level security;

-- Catálogo: lectura pública (solo nodos activos), escritura solo service_role.
revoke all on public.character_skill_nodes from anon, authenticated;
grant select on public.character_skill_nodes to authenticated;
grant all on public.character_skill_nodes to service_role;
create policy "character_skill_nodes_read" on public.character_skill_nodes
  for select to authenticated using (is_active);

-- Rangos: el jugador LEE su fila; nadie del cliente escribe (solo la RPC service_role).
revoke all on public.player_skill_ranks from anon, authenticated;
grant select on public.player_skill_ranks to authenticated;
grant all on public.player_skill_ranks to service_role;
create policy "player_skill_ranks_select_own" on public.player_skill_ranks
  for select to authenticated using (auth.uid() = player_id);

-- Operaciones: solo service_role (ni lectura hace falta desde el cliente).
revoke all on public.skill_rank_operations from anon, authenticated;
grant all on public.skill_rank_operations to service_role;

-- RPC: solo el servidor.
revoke all on function public.rank_up_skill_node(uuid, text, integer, uuid) from public, anon, authenticated;
grant execute on function public.rank_up_skill_node(uuid, text, integer, uuid) to service_role;

commit;

-- Comprobación posterior (todo debe ser false para authenticated salvo la lectura de su fila):
--   select has_table_privilege('authenticated','public.player_skill_ranks','update')       as puede_escribir_rangos,
--          has_function_privilege('authenticated','public.rank_up_skill_node(uuid,text,integer,uuid)','execute') as puede_ejecutar_rpc,
--          has_table_privilege('authenticated','public.character_skill_nodes','select')     as puede_leer_catalogo;
