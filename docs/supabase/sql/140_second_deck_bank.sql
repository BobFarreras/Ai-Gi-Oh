-- docs/supabase/sql/140_second_deck_bank.sql
-- Ficha 8 — Doble Arsenal (segundo mazo). Enfoque LIGERO (no toca la ruta de combate):
--   · player_deck_slots / player_fusion_deck_slots siguen siendo SIEMPRE el mazo ACTIVO (combate, IA y builder
--     quedan intactos: siguen leyendo el activo con getDeck).
--   · El segundo mazo (banco) vive en tablas NUEVAS: player_deck_bank (+ su espejo de fusión).
--   · "Hacer principal / Editar Mazo 2" = RPC swap_active_deck: intercambia activo <-> banco en UNA transacción
--     atómica e idempotente. El jugador edita SIEMPRE el activo con el builder normal.
--   · El nodo del árbol (UNLOCK_SECOND_DECK) solo HABILITA la UI del switcher; la RPC lo re-valida (data-driven).
--
-- ORDEN: tablas + RPC son aditivas (seguras de aplicar en cualquier momento). La ACTIVACIÓN del nodo
-- (is_active=true) va en la Fase 2 (cuando exista la UI del arsenal), NO aquí — aquí solo se re-gatea el nodo.
begin;

-- ── 1) Tablas del banco (2º mazo). Mismo shape que el activo: 20 slots + 2 de fusión ──────────────────
create table if not exists public.player_deck_bank (
  player_id  uuid not null references auth.users (id) on delete cascade,
  slot_index integer not null check (slot_index >= 0),
  card_id    text,
  primary key (player_id, slot_index)
);

create table if not exists public.player_deck_bank_fusion (
  player_id  uuid not null references auth.users (id) on delete cascade,
  slot_index integer not null check (slot_index >= 0),
  card_id    text,
  primary key (player_id, slot_index)
);

-- ── 2) Idempotencia del swap ───────────────────────────────────────────────────────────────────────
create table if not exists public.deck_swap_operations (
  operation_id uuid primary key,
  player_id    uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- ── 3) RPC de swap: intercambia activo <-> banco (main + fusión) en una transacción, idempotente ──────
create or replace function public.swap_active_deck(
  p_player_id    uuid,
  p_operation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_has_node   boolean;
  v_bank_count integer;
  v_active_main   jsonb;
  v_active_fusion jsonb;
begin
  if p_player_id is null or p_operation_id is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_args');
  end if;

  -- Permiso: el jugador debe tener desbloqueado (rank >= 1) un nodo con efecto UNLOCK_SECOND_DECK (data-driven).
  select exists(
    select 1
      from public.player_skill_ranks r
      join public.character_skill_nodes n on n.id = r.node_id
     where r.player_id = p_player_id
       and r.rank >= 1
       and n.effect ->> 'kind' = 'UNLOCK_SECOND_DECK'
  ) into v_has_node;
  if not v_has_node then
    return jsonb_build_object('ok', false, 'reason', 'no_second_deck');
  end if;

  -- Idempotencia: registra la operación antes de aplicar. Un retry no vuelve a intercambiar.
  insert into public.deck_swap_operations (operation_id, player_id)
  values (p_operation_id, p_player_id)
  on conflict (operation_id) do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  -- Si el banco aún no existe (nunca inicializado), sémbralo como copia del activo → el swap queda como no-op
  -- consistente en vez de dejar el activo vacío.
  select count(*) into v_bank_count from public.player_deck_bank where player_id = p_player_id;
  if v_bank_count = 0 then
    insert into public.player_deck_bank (player_id, slot_index, card_id)
      select player_id, slot_index, card_id from public.player_deck_slots where player_id = p_player_id;
    insert into public.player_deck_bank_fusion (player_id, slot_index, card_id)
      select player_id, slot_index, card_id from public.player_fusion_deck_slots where player_id = p_player_id;
  end if;

  -- Swap sin tabla temporal: se captura el activo en jsonb {slot_index: card_id}, se copia banco->activo y
  -- luego el activo capturado -> banco.
  select jsonb_object_agg(slot_index::text, card_id) into v_active_main
    from public.player_deck_slots where player_id = p_player_id;
  select jsonb_object_agg(slot_index::text, card_id) into v_active_fusion
    from public.player_fusion_deck_slots where player_id = p_player_id;

  update public.player_deck_slots s
     set card_id = b.card_id
    from public.player_deck_bank b
   where s.player_id = p_player_id and b.player_id = p_player_id and s.slot_index = b.slot_index;
  update public.player_deck_bank d
     set card_id = v_active_main ->> d.slot_index::text
   where d.player_id = p_player_id;

  update public.player_fusion_deck_slots s
     set card_id = b.card_id
    from public.player_deck_bank_fusion b
   where s.player_id = p_player_id and b.player_id = p_player_id and s.slot_index = b.slot_index;
  update public.player_deck_bank_fusion d
     set card_id = v_active_fusion ->> d.slot_index::text
   where d.player_id = p_player_id;

  return jsonb_build_object('ok', true);
end;
$$;

-- ── 4) RLS y permisos ─────────────────────────────────────────────────────────────────────────────
-- El banco NO es tabla de valor: como el mazo activo, el jugador lee/escribe SUS filas (editar el Mazo 2 tras
-- hacerlo activo pasa por el builder normal; el banco solo lo escribe el swap o la inicialización de copia).
alter table public.player_deck_bank        enable row level security;
alter table public.player_deck_bank_fusion enable row level security;
alter table public.deck_swap_operations    enable row level security;

revoke all on public.player_deck_bank        from anon, authenticated;
revoke all on public.player_deck_bank_fusion from anon, authenticated;
grant select, insert, update on public.player_deck_bank        to authenticated;
grant select, insert, update on public.player_deck_bank_fusion to authenticated;
grant all on public.player_deck_bank        to service_role;
grant all on public.player_deck_bank_fusion to service_role;

create policy "player_deck_bank_own"        on public.player_deck_bank        for all to authenticated using (auth.uid() = player_id) with check (auth.uid() = player_id);
create policy "player_deck_bank_fusion_own" on public.player_deck_bank_fusion for all to authenticated using (auth.uid() = player_id) with check (auth.uid() = player_id);

revoke all on public.deck_swap_operations from anon, authenticated;
grant all on public.deck_swap_operations to service_role;

revoke all on function public.swap_active_deck(uuid, uuid) from public, anon, authenticated;
grant execute on function public.swap_active_deck(uuid, uuid) to service_role;

-- ── 5) Re-gate del nodo Doble Arsenal (potente): profundo, para veteranos ────────────────────────────
-- Gate: Veterano Nv.5 (maxear el escalador de Arsenal). Coste: 5 pts. is_active se deja como está (false)
-- hasta la Fase 2 (UI del arsenal); aquí solo se ajustan gate y coste.
update public.character_skill_nodes
   set prerequisites = '[{"nodeId":"node-ars-veterano","minRank":5}]'::jsonb,
       cost_per_rank = 5
 where id = 'node-ars-doble-mazo';

commit;

-- Comprobación posterior:
--   select has_function_privilege('authenticated','public.swap_active_deck(uuid,uuid)','execute') as puede_ejecutar; -- false
--   select prerequisites, cost_per_rank from public.character_skill_nodes where id = 'node-ars-doble-mazo';
