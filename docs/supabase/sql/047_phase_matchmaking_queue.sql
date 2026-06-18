-- docs/supabase/sql/047_phase_matchmaking_queue.sql - Cola de emparejamiento aleatorio para el modo multijugador.

-- ─────────────────────────────────────────────
-- COLA DE EMPAREJAMIENTO
-- ─────────────────────────────────────────────
create table public.matchmaking_queue (
  player_id  uuid primary key references public.player_profiles(player_id) on delete cascade,
  deck_ids   text[] not null default '{}',
  joined_at  timestamptz not null default now()
);

alter table public.matchmaking_queue enable row level security;

create policy "matchmaking_queue_select_own" on public.matchmaking_queue
  for select using (auth.uid() = player_id);

create policy "matchmaking_queue_insert_own" on public.matchmaking_queue
  for insert with check (auth.uid() = player_id);

create policy "matchmaking_queue_delete_own" on public.matchmaking_queue
  for delete using (auth.uid() = player_id);

-- ─────────────────────────────────────────────
-- FUNCIÓN ATÓMICA DE EMPAREJAMIENTO
-- FOR UPDATE SKIP LOCKED previene condiciones de carrera cuando dos jugadores
-- intentan emparejarse simultáneamente.
-- security definer: se ejecuta con privilegios del propietario de la función
-- (postgres) para poder eliminar la fila del rival sin violar RLS.
-- ─────────────────────────────────────────────
create or replace function public.find_or_create_match(
  p_player_id uuid,
  p_deck_ids  text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opponent matchmaking_queue%rowtype;
  v_match_id uuid;
  v_seed     text;
begin
  -- Eliminar entrada propia obsoleta si existe
  delete from matchmaking_queue where player_id = p_player_id;

  -- Intentar bloquear a un rival (el que lleva más tiempo esperando)
  select * into v_opponent
  from matchmaking_queue
  where player_id != p_player_id
  order by joined_at asc
  limit 1
  for update skip locked;

  if not found then
    -- Sin rival: unirse a la cola
    insert into matchmaking_queue (player_id, deck_ids)
    values (p_player_id, p_deck_ids);

    return jsonb_build_object('matched', false);
  end if;

  -- Rival encontrado: sacarlo de la cola
  delete from matchmaking_queue where player_id = v_opponent.player_id;

  -- Crear sesión de partida (el que esperaba más es player_a)
  v_seed     := gen_random_uuid()::text;
  v_match_id := gen_random_uuid();

  insert into match_sessions (id, player_a_id, player_b_id, deck_a_ids, deck_b_ids, seed, status)
  values (v_match_id, v_opponent.player_id, p_player_id, v_opponent.deck_ids, p_deck_ids, v_seed, 'WAITING');

  return jsonb_build_object(
    'matched',     true,
    'match_id',    v_match_id
  );
end;
$$;
