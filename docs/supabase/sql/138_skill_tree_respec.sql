-- docs/supabase/sql/138_skill_tree_respec.sql
-- Ficha 8 — Reasignación (respec) del árbol de habilidades (modelo A: gratis con llave).
--
-- Qué hace: borra TODOS los rangos del jugador (reset total) SI tiene la "llave" — un nodo desbloqueado cuyo
-- efecto es GRANT_RESPEC_TOKEN (hoy `node-ars-reasignar`). No cuesta puntos ni Nexus: los puntos se recalculan
-- solos desde el nivel. El reset borra también la propia llave, así que para volver a reasignar hay que
-- recomprarla (coste implícito). Idempotente por operación (el reintento de red no re-borra).
--
-- ORDEN DE DESPLIEGUE: la RPC y la tabla son aditivas y seguras de aplicar en cualquier momento. La ACTIVACIÓN
-- del nodo (is_active=true) hace visible la llave en la UI; aplícala junto con / después del deploy del código
-- del respec (ruta + botón), para que el jugador que compre la llave tenga el botón disponible.
--
-- Seguridad (mismo candado que rank_up_skill_node):
--   · respec_skill_tree → security definer, EXECUTE solo service_role. Un server route resuelve la sesión
--     (auth.uid()) y pasa p_player_id. El cliente NUNCA escribe player_skill_ranks.
--   · La llave se comprueba DENTRO de la RPC de forma data-driven (efecto = GRANT_RESPEC_TOKEN), no por id
--     hardcodeado: si el catálogo cambia el id o añade otro nodo de respec, sigue funcionando.
begin;

-- ── 1) Idempotencia de la reasignación (una operación = un intento de reset) ────────────────────────────
create table if not exists public.skill_respec_operations (
  operation_id uuid primary key,
  player_id    uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- ── 2) RPC de reasignación: valida la llave y borra los rangos en una transacción ──────────────────────
create or replace function public.respec_skill_tree(
  p_player_id    uuid,
  p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_has_key boolean;
  v_cleared integer;
begin
  if p_player_id is null or p_operation_id is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_args');
  end if;

  -- Llave: el jugador debe tener desbloqueado (rank >= 1) un nodo cuyo efecto sea GRANT_RESPEC_TOKEN.
  -- Data-driven: no se ata a un id concreto de nodo.
  select exists(
    select 1
      from public.player_skill_ranks r
      join public.character_skill_nodes n on n.id = r.node_id
     where r.player_id = p_player_id
       and r.rank >= 1
       and n.effect ->> 'kind' = 'GRANT_RESPEC_TOKEN'
  ) into v_has_key;

  if not v_has_key then
    return jsonb_build_object('ok', false, 'reason', 'no_respec_key');
  end if;

  -- Idempotencia: se registra la operación ANTES de borrar. Si ya existía, el reset ya se hizo → no repetir.
  insert into public.skill_respec_operations (operation_id, player_id)
  values (p_operation_id, p_player_id)
  on conflict (operation_id) do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  -- Reset total: borra todos los rangos del jugador (incluida la propia llave).
  with deleted as (
    delete from public.player_skill_ranks where player_id = p_player_id returning 1
  )
  select count(*) into v_cleared from deleted;

  return jsonb_build_object('ok', true, 'cleared', coalesce(v_cleared, 0));
end;
$$;

-- ── 3) Permisos: RLS de la tabla de operaciones + EXECUTE solo service_role ─────────────────────────────
alter table public.skill_respec_operations enable row level security;
revoke all on public.skill_respec_operations from anon, authenticated;
grant all on public.skill_respec_operations to service_role;

revoke all on function public.respec_skill_tree(uuid, uuid) from public, anon, authenticated;
grant execute on function public.respec_skill_tree(uuid, uuid) to service_role;

-- ── 4) Activar la llave en el catálogo (hazlo junto al deploy del código del respec) ────────────────────
update public.character_skill_nodes set is_active = true where id = 'node-ars-reasignar';

commit;

-- Comprobación posterior:
--   select has_function_privilege('authenticated','public.respec_skill_tree(uuid,uuid)','execute') as puede_ejecutar; -- debe ser false
--   select is_active from public.character_skill_nodes where id = 'node-ars-reasignar';                                -- debe ser true
