-- supabase/tests/database/arena_modes_foundation.test.sql - Verifica seguridad, constraints y catálogos base de los nuevos modos PvE.
begin;

create extension if not exists pgtap with schema extensions;
select plan(36);

select has_table('public', 'combat_sessions', 'Existe el agregado de sesiones autoritativas');
select has_table('public', 'player_survival_runs', 'Existe el agregado de runs');
select has_table('public', 'survival_battles', 'Existe el historial de batallas');
select has_table('public', 'combat_mode_wallets', 'Existe la cartera de Fragmentos');
select has_table('public', 'olympus_champions', 'Existe el catálogo de campeones');
select has_table('public', 'olympus_battles', 'Existe el historial de Olimpo');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.combat_sessions'::regclass),
  'RLS protege sesiones'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.player_survival_runs'::regclass),
  'RLS protege runs'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.combat_mode_wallets'::regclass),
  'RLS protege la cartera'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.olympus_battles'::regclass),
  'RLS protege batallas de Olimpo'
);

select ok(
  not has_table_privilege('authenticated', 'public.player_survival_runs', 'INSERT'),
  'authenticated no puede crear runs directamente'
);
select ok(
  not has_table_privilege('authenticated', 'public.combat_mode_wallets', 'UPDATE'),
  'authenticated no puede modificar Fragmentos'
);
select ok(
  has_table_privilege('authenticated', 'public.olympus_champions', 'SELECT'),
  'authenticated puede leer el catálogo de campeones'
);
select ok(
  not has_function_privilege('authenticated', 'public.start_survival_run(uuid,integer,integer)', 'EXECUTE'),
  'authenticated no puede invocar mutaciones server-side'
);

select results_eq(
  $$select count(*)::bigint from public.survival_rulesets where is_active$$,
  array[1::bigint],
  'Existe exactamente un ruleset activo'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_champions where is_active$$,
  array[8::bigint],
  'El catálogo inicial contiene los ocho campeones del ladder'
);
select results_eq(
  $$select required_tier from public.olympus_champions where id = 'guill'$$,
  array[6],
  'Guill se desbloquea exclusivamente desde el tier 6'
);
select results_eq(
  $$select required_ladder_position from public.olympus_champions where id = 'gokernel'$$,
  array[8],
  'Gokernel conserva la octava posición del ladder'
);

select lives_ok(
  $$insert into auth.users (id, aud, role, email)
    values ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'arena-phase2@example.test')$$,
  'Se prepara un jugador aislado para probar transacciones'
);
select results_eq(
  $$select current_lp from public.start_survival_run(
    '00000000-0000-0000-0000-000000000101', 8000, 1
  )$$,
  array[8000],
  'La run nace con los LP máximos fijados por servidor'
);
select throws_ok(
  $$select public.start_survival_run('00000000-0000-0000-0000-000000000101', 8000, 1)$$,
  '23505',
  null,
  'El índice parcial impide dos runs activas'
);
select results_eq(
  $$select public.credit_ascension_fragments(
    '00000000-0000-0000-0000-000000000101', 'reward-1', 100, 'SURVIVAL_WIN'
  )$$,
  array[100],
  'La cartera acredita Fragmentos'
);
select results_eq(
  $$select public.credit_ascension_fragments(
    '00000000-0000-0000-0000-000000000101', 'reward-1', 100, 'SURVIVAL_WIN'
  )$$,
  array[100],
  'Repetir operation_id no duplica el saldo'
);
select throws_ok(
  $$select public.grant_champion_unlock_from_arena_win(
    '00000000-0000-0000-0000-000000000101', 'guill', 5, 'wrong-tier'
  )$$,
  '22023',
  'CHAMPION_TIER_MISMATCH',
  'Guill no se desbloquea fuera del tier 6'
);
select results_eq(
  $$select public.grant_champion_unlock_from_arena_win(
    '00000000-0000-0000-0000-000000000101', 'guill', 6, 'arena-win-6'
  )$$,
  array[true],
  'La victoria verificada del tier correcto desbloquea a Guill'
);
select results_eq(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000101', 'guill', 'guill-power-1', 'upgrade-1'
  )$$,
  array[60],
  'La compra descuenta el coste del campeón concreto'
);
select results_eq(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000101', 'guill', 'guill-power-1', 'upgrade-1'
  )$$,
  array[60],
  'Repetir la compra no vuelve a descontar Fragmentos'
);
select results_eq(
  $$select count(*)::bigint from public.combat_mode_wallet_transactions
    where player_id = '00000000-0000-0000-0000-000000000101'$$,
  array[2::bigint],
  'El ledger conserva exactamente un crédito y un débito'
);
select results_eq(
  $$select battle_index from public.issue_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    (select id from public.player_survival_runs where player_id = '00000000-0000-0000-0000-000000000101'),
    '00000000-0000-0000-0000-000000000201', 'training-tier-4', 4, 0, 'seed-survival',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 1, now() + interval '15 minutes'
  )$$,
  array[1],
  'La primera batalla de Supervivencia avanza el índice a uno'
);
select results_eq(
  $$select current_lp from public.complete_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201', 'WIN', 6000, '{"fragments":20}'::jsonb, 20
  )$$,
  array[6000],
  'La victoria transporta los LP finales verificados'
);
select results_eq(
  $$select wins from public.complete_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201', 'WIN', 6000, '{"fragments":20}'::jsonb, 20
  )$$,
  array[1],
  'Completar de nuevo la batalla no duplica la victoria'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000301', 'guill', 'legendary-kernel', 'seed-olympus',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', '{}'::jsonb, 1,
    'cccccccccccccccccccccccccccccccc', 'dddddddddddddddddddddddddddddddd',
    now() + interval '15 minutes'
  )$$,
  array[1],
  'Olimpo consume el primer intento al emitir la batalla'
);
select results_eq(
  $$select status from public.complete_olympus_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000301', 'WIN', '{"fragments":10}'::jsonb, 10
  )$$,
  array['COMPLETED'::text],
  'Olimpo persiste la victoria verificada'
);
select results_eq(
  $$select attempts_used from public.olympus_daily_usage
    where player_id = '00000000-0000-0000-0000-000000000101'
      and period_key = (now() at time zone 'UTC')::date$$,
  array[1],
  'El allowance usa el periodo UTC calculado por servidor'
);
select results_eq(
  $$select public.respec_champion_upgrades(
    '00000000-0000-0000-0000-000000000101', 'guill', 'respec-1'
  )$$,
  array[120],
  'El respec devuelve el 75 por ciento del coste configurado'
);
select is(
  (select unlocked_node_ids from public.player_olympus_champion_progress
    where player_id = '00000000-0000-0000-0000-000000000101' and champion_id = 'guill'),
  '{}'::text[],
  'El respec limpia únicamente el árbol del campeón elegido'
);

select * from finish();
rollback;
