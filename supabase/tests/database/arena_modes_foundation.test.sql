-- supabase/tests/database/arena_modes_foundation.test.sql - Verifica seguridad, constraints y catálogos base de los nuevos modos PvE.
begin;

create extension if not exists pgtap with schema extensions;
select plan(60);

select has_table('public', 'combat_sessions', 'Existe el agregado de sesiones autoritativas');
select has_table('public', 'player_survival_runs', 'Existe el agregado de runs');
select has_table('public', 'survival_battles', 'Existe el historial de batallas');
select has_table('public', 'combat_mode_wallets', 'Existe la cartera de Fragmentos');
select has_table('public', 'olympus_champions', 'Existe el catálogo de campeones');
select has_table('public', 'olympus_battles', 'Existe el historial de Olimpo');
select has_index(
  'public', 'player_survival_runs', 'idx_player_survival_runs_best_wins',
  'El récord personal se resuelve con índice por jugador y victorias'
);

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
  $$select (stage.ascension_modifiers_json ->> 'statBonusPerRank')::integer
    from public.survival_scaling_stages stage
    where stage.ai_profile = 'MYTHIC'
    order by stage.from_battle desc limit 1$$,
  array[175],
  'El tramo MYTHIC prolonga el escalado de stats tras alcanzar los caps'
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
select results_eq(
  $$select current_lp from public.start_survival_run(
    '00000000-0000-0000-0000-000000000101', 8000, 1
  )$$,
  array[8000],
  'Reintentar el inicio devuelve la misma run sin duplicarla'
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
select lives_ok(
  $$select public.invalidate_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000201'
  )$$,
  'Un snapshot obsoleto puede invalidarse de forma autoritativa'
);
select results_eq(
  $$select status from public.survival_battles
    where battle_id = '00000000-0000-0000-0000-000000000201'$$,
  array['EXPIRED'::text],
  'La batalla invalidada deja de bloquear la expedición'
);
select results_eq(
  $$select status from public.combat_sessions
    where battle_id = '00000000-0000-0000-0000-000000000201'$$,
  array['EXPIRED'::text],
  'La sesión incompatible también queda expirada'
);
select results_eq(
  $$select current_battle_index from public.player_survival_runs
    where player_id = '00000000-0000-0000-0000-000000000101'$$,
  array[0],
  'Invalidar restaura el índice para no saltar el encuentro'
);
select results_eq(
  $$select battle_index from public.issue_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    (select id from public.player_survival_runs where player_id = '00000000-0000-0000-0000-000000000101'),
    '00000000-0000-0000-0000-000000000202', 'training-tier-4', 4, 0, 'seed-survival-renewed',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', '{}'::jsonb, 2, now() + interval '15 minutes'
  )$$,
  array[1],
  'La batalla renovada conserva el índice y admite una seed nueva'
);
select results_eq(
  $$select current_lp from public.complete_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000202', 'WIN', 6000, '{"fragments":20}'::jsonb, 20
  )$$,
  array[6000],
  'La victoria transporta los LP finales verificados'
);
select results_eq(
  $$select wins from public.complete_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000202', 'WIN', 6000, '{"fragments":20}'::jsonb, 20
  )$$,
  array[1],
  'Completar de nuevo la batalla no duplica la victoria'
);
select lives_ok(
  $$update public.player_survival_runs
    set wins = 4, current_battle_index = 4, current_lp = 5000
    where player_id = '00000000-0000-0000-0000-000000000101'$$,
  'Se prepara el hito quinto sin alterar la función bajo prueba'
);
select results_eq(
  $$select battle_index from public.issue_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    (select id from public.player_survival_runs where player_id = '00000000-0000-0000-0000-000000000101'),
    '00000000-0000-0000-0000-000000000203', 'training-gokernel', 8, 0, 'seed-milestone',
    'ffffffffffffffffffffffffffffffff', '{}'::jsonb, 2, now() + interval '15 minutes'
  )$$,
  array[5],
  'El encuentro de hito conserva la secuencia de la expedición'
);
select results_eq(
  $$select current_lp from public.complete_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000203', 'WIN', 5000, '{"fragments":30}'::jsonb, 30
  )$$,
  array[7000],
  'La quinta victoria recupera 2000 LP sin confiar en el cliente'
);
select results_eq(
  $$select milestone_heal from public.survival_battles
    where battle_id = '00000000-0000-0000-0000-000000000203'$$,
  array[2000],
  'La curación del hito queda auditada en la batalla'
);
select results_eq(
  $$select battle_index from public.issue_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    (select id from public.player_survival_runs where player_id = '00000000-0000-0000-0000-000000000101'),
    '00000000-0000-0000-0000-000000000204', 'training-gokernel', 8, 0, 'seed-defeat',
    '99999999999999999999999999999999', '{}'::jsonb, 2, now() + interval '15 minutes'
  )$$,
  array[6],
  'La expedición puede continuar después del hito'
);
select results_eq(
  $$select status from public.complete_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000204', 'LOSS', 3000, '{}'::jsonb, 0
  )$$,
  array['COMPLETED_DEFEAT'::text],
  'La derrota cierra la run y evita transportar LP manipulados'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000301', 'guill', 'zeus', 'seed-olympus',
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
  array[150],
  'El respec devuelve el 75 por ciento del coste configurado'
);
select is(
  (select unlocked_node_ids from public.player_olympus_champion_progress
    where player_id = '00000000-0000-0000-0000-000000000101' and champion_id = 'guill'),
  '{}'::text[],
  'El respec limpia únicamente el árbol del campeón elegido'
);

-- Abandono: una batalla jugable sin liquidar deja de ser gratis al caducar su sesión.
select lives_ok(
  $$select public.start_survival_run('00000000-0000-0000-0000-000000000101', 8000, 1)$$,
  'Tras una derrota se puede iniciar una expedición nueva'
);
select results_eq(
  $$select battle_index from public.issue_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    (select id from public.player_survival_runs
      where player_id = '00000000-0000-0000-0000-000000000101' and status = 'ACTIVE'),
    '00000000-0000-0000-0000-000000000205', 'training-tier-4', 4, 0, 'seed-abandon',
    '77777777777777777777777777777777', '{}'::jsonb, 2, now() + interval '15 minutes'
  )$$,
  array[1],
  'La expedición nueva emite su primera batalla'
);
select results_eq(
  $$select status from public.forfeit_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000205'
  )$$,
  array['COMPLETED_DEFEAT'::text],
  'Abandonar un combate jugable cierra la expedición como derrota'
);
select results_eq(
  $$select outcome, status, ending_lp from public.survival_battles
    where battle_id = '00000000-0000-0000-0000-000000000205'$$,
  $$values ('LOSS'::text, 'COMPLETED'::text, 0)$$,
  'La batalla abandonada queda registrada como derrota sin LP'
);
select results_eq(
  $$select count(*)::bigint from public.combat_mode_wallet_transactions
    where player_id = '00000000-0000-0000-0000-000000000101'
      and operation_id like '%00000000-0000-0000-0000-000000000205%'$$,
  array[0::bigint],
  'El abandono no acredita Fragmentos'
);
select results_eq(
  $$select status from public.forfeit_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000205'
  )$$,
  array['COMPLETED_DEFEAT'::text],
  'Repetir el abandono es idempotente y no vuelve a castigar'
);

-- Checkpoint del diario: solo crece, nunca reescribe lo ya jugado.
select lives_ok(
  $$select public.start_survival_run('00000000-0000-0000-0000-000000000101', 8000, 1)$$,
  'El abandono anterior cerró la run, así que se abre otra para el checkpoint'
);
select results_eq(
  $$select battle_index from public.issue_survival_battle(
    '00000000-0000-0000-0000-000000000101',
    (select id from public.player_survival_runs
      where player_id = '00000000-0000-0000-0000-000000000101' and status = 'ACTIVE'),
    '00000000-0000-0000-0000-000000000206', 'training-tier-4', 4, 0, 'seed-checkpoint',
    '66666666666666666666666666666666', '{}'::jsonb, 3, now() + interval '15 minutes'
  )$$,
  array[1],
  'Se emite un combate para probar el avance registrado'
);
select results_eq(
  $$select public.checkpoint_combat_session(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000206',
    '[{"sequence":1},{"sequence":2}]'::jsonb
  )$$,
  array[2],
  'El avance se registra con su longitud'
);
select results_eq(
  $$select public.checkpoint_combat_session(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000206',
    '[{"sequence":1}]'::jsonb
  )$$,
  array[2],
  'Un diario más corto no puede acortar el historial'
);
select results_eq(
  $$select jsonb_array_length(journal_json) from public.combat_sessions
    where battle_id = '00000000-0000-0000-0000-000000000206'$$,
  array[2],
  'El historial persistido conserva el avance mayor'
);

select * from finish();
rollback;
