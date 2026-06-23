-- docs/supabase/sql/058_phase_progression_login_streak.sql - Sistema de racha de login diario (F1 de progresión/retención). Claim atómico e idempotente por día UTC, server-authoritative vía auth.uid().
begin;

-- Estado de racha por jugador. Escrituras solo vía RPC SECURITY DEFINER.
create table if not exists public.player_login_streaks (
  player_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_claim_date date,
  total_claims integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Calendario de recompensas (config editable por admin). Ciclo de 7 días.
create table if not exists public.login_reward_calendar (
  day_index integer primary key check (day_index between 1 and 7),
  reward_type text not null check (reward_type in ('NEXUS', 'CARD')),
  reward_nexus integer not null default 0,
  reward_card_id text,
  label text
);

alter table public.player_login_streaks enable row level security;
alter table public.login_reward_calendar enable row level security;

-- Cada jugador solo ve su propia racha.
drop policy if exists "login_streaks_select_own" on public.player_login_streaks;
create policy "login_streaks_select_own"
on public.player_login_streaks
for select
to authenticated
using (player_id = auth.uid());

-- El calendario es config pública para usuarios autenticados.
drop policy if exists "login_calendar_select_all" on public.login_reward_calendar;
create policy "login_calendar_select_all"
on public.login_reward_calendar
for select
to authenticated
using (true);

-- Defensa en profundidad: solo SELECT a authenticated; escritura solo vía RPC definer.
revoke all on public.player_login_streaks from anon, authenticated;
revoke all on public.login_reward_calendar from anon, authenticated;
grant select on public.player_login_streaks to authenticated;
grant select on public.login_reward_calendar to authenticated;
grant all on public.player_login_streaks to service_role;
grant all on public.login_reward_calendar to service_role;

-- Seed del calendario (recompensas Nexus escalables; el día 7 es un hito mayor).
-- reward_card_id puede configurarse luego para dar una carta especial el día 7.
insert into public.login_reward_calendar (day_index, reward_type, reward_nexus, reward_card_id, label) values
  (1, 'NEXUS', 100, null, 'Día 1'),
  (2, 'NEXUS', 150, null, 'Día 2'),
  (3, 'NEXUS', 200, null, 'Día 3'),
  (4, 'NEXUS', 250, null, 'Día 4'),
  (5, 'NEXUS', 300, null, 'Día 5'),
  (6, 'NEXUS', 400, null, 'Día 6'),
  (7, 'NEXUS', 600, null, 'Día 7 · Hito')
on conflict (day_index) do nothing;

-- Claim atómico e idempotente del login diario. Identidad = auth.uid() (server-authoritative).
create or replace function public.claim_daily_login()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player uuid;
  v_today date;
  v_streak public.player_login_streaks;
  v_new_streak integer;
  v_day_index integer;
  v_reward public.login_reward_calendar;
begin
  v_player := auth.uid();
  if v_player is null then
    raise exception 'Sesión no autenticada para reclamar el login diario.' using errcode = '42501';
  end if;

  v_today := (now() at time zone 'utc')::date;

  insert into public.player_login_streaks (player_id) values (v_player)
  on conflict (player_id) do nothing;

  select * into v_streak from public.player_login_streaks where player_id = v_player for update;

  -- Idempotencia: si ya reclamó hoy, no se aplica nada y se devuelve el estado actual.
  if v_streak.last_claim_date = v_today then
    v_day_index := ((greatest(v_streak.current_streak, 1) - 1) % 7) + 1;
    select * into v_reward from public.login_reward_calendar where day_index = v_day_index;
    return jsonb_build_object(
      'applied', false, 'alreadyClaimed', true,
      'currentStreak', v_streak.current_streak, 'dayIndex', v_day_index,
      'rewardType', v_reward.reward_type, 'rewardNexus', v_reward.reward_nexus, 'rewardCardId', v_reward.reward_card_id
    );
  end if;

  -- Día consecutivo continúa la racha; un hueco la reinicia a 1.
  if v_streak.last_claim_date = v_today - 1 then
    v_new_streak := v_streak.current_streak + 1;
  else
    v_new_streak := 1;
  end if;

  v_day_index := ((v_new_streak - 1) % 7) + 1;
  select * into v_reward from public.login_reward_calendar where day_index = v_day_index;

  update public.player_login_streaks
     set current_streak = v_new_streak,
         longest_streak = greatest(longest_streak, v_new_streak),
         last_claim_date = v_today,
         total_claims = total_claims + 1,
         updated_at = now()
   where player_id = v_player;

  if v_reward.reward_nexus > 0 then
    insert into public.player_wallets (player_id, nexus) values (v_player, 1000)
    on conflict (player_id) do nothing;
    update public.player_wallets set nexus = nexus + v_reward.reward_nexus where player_id = v_player;
  end if;

  if v_reward.reward_type = 'CARD' and v_reward.reward_card_id is not null then
    insert into public.player_collection_cards (player_id, card_id, owned_copies)
    values (v_player, v_reward.reward_card_id, 1)
    on conflict (player_id, card_id) do update
      set owned_copies = public.player_collection_cards.owned_copies + 1, updated_at = now();
  end if;

  return jsonb_build_object(
    'applied', true, 'alreadyClaimed', false,
    'currentStreak', v_new_streak, 'dayIndex', v_day_index,
    'rewardType', v_reward.reward_type, 'rewardNexus', v_reward.reward_nexus, 'rewardCardId', v_reward.reward_card_id
  );
end;
$$;

revoke all on function public.claim_daily_login() from public, anon;
grant execute on function public.claim_daily_login() to authenticated;

commit;
