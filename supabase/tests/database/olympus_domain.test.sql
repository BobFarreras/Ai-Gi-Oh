-- supabase/tests/database/olympus_domain.test.sql - Fija tablas, RPC, seeds y economía de Olimpo antes y después de hacerlo jugable.
begin;

create extension if not exists pgtap with schema extensions;
select plan(75);

-- 1. Superficie persistida del subdominio.
select has_table('public', 'olympus_champions', 'Existe el catálogo de campeones');
select has_table('public', 'olympus_champion_upgrade_nodes', 'Existe el árbol de mejoras');
select has_table('public', 'olympus_opponents', 'Existe el catálogo de leyendas');
select has_table('public', 'olympus_opponent_deck_entries', 'Existe el deck legendario versionado');
select has_table('public', 'player_olympus_champion_unlocks', 'Existen los desbloqueos por jugador');
select has_table('public', 'player_olympus_champion_progress', 'Existe el progreso de árbol por jugador');
select has_table('public', 'olympus_daily_usage', 'Existe el allowance diario');
select has_table('public', 'olympus_battles', 'Existe el historial de batallas');
select has_table('public', 'olympus_first_victories', 'Existe el registro de primeras victorias');

-- 2. El cliente autenticado lee lo suyo y no escribe nada de valor.
select ok(
  (select relrowsecurity from pg_class where oid = 'public.olympus_daily_usage'::regclass),
  'RLS protege el allowance diario'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.player_olympus_champion_progress'::regclass),
  'RLS protege el progreso de campeón'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.olympus_first_victories'::regclass),
  'RLS protege las primeras victorias'
);
select ok(
  not has_table_privilege('authenticated', 'public.olympus_daily_usage', 'UPDATE'),
  'authenticated no puede regalarse intentos'
);
select ok(
  not has_table_privilege('authenticated', 'public.olympus_battles', 'INSERT'),
  'authenticated no puede fabricar batallas'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_olympus_champion_progress', 'UPDATE'),
  'authenticated no puede desbloquear nodos sin pagar'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.issue_olympus_battle(uuid,uuid,text,text,text,text,jsonb,integer,text,text,timestamptz)',
    'EXECUTE'
  ),
  'authenticated no puede emitir batallas de Olimpo'
);
select ok(
  not has_function_privilege('authenticated', 'public.purchase_champion_upgrade(uuid,text,text,text)', 'EXECUTE'),
  'authenticated no puede comprar nodos por su cuenta'
);
select ok(
  not has_function_privilege('authenticated', 'public.respec_champion_upgrades(uuid,text,text)', 'EXECUTE'),
  'authenticated no puede reasignar el árbol por su cuenta'
);
select ok(
  not has_table_privilege('anon', 'public.olympus_champions', 'SELECT'),
  'El catálogo no se expone a visitantes anónimos'
);

-- 3. Seeds: el catálogo cubre el ladder completo y las leyendas traen deck real.
select results_eq(
  $$select count(*)::bigint from public.olympus_champions where is_active$$,
  array[8::bigint],
  'Los ocho campeones del ladder están disponibles'
);
select results_eq(
  $$select count(distinct arena_opponent_id)::bigint from public.olympus_champions$$,
  array[8::bigint],
  'Cada campeón procede de un rival de Arena distinto'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_champions champion
    where (select count(*) from public.olympus_champion_upgrade_nodes node
      where node.champion_id = champion.id and node.is_active) <> 3$$,
  array[0::bigint],
  'Cada campeón nace con las tres ramas del árbol'
);
select results_eq(
  $$select count(distinct branch)::bigint from public.olympus_champion_upgrade_nodes$$,
  array[3::bigint],
  'El árbol declara exactamente Potencia, Resistencia e Identidad'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_opponents opponent
    where opponent.is_active and not exists (
      select 1 from public.olympus_opponent_deck_entries entry where entry.opponent_id = opponent.id
    )$$,
  array[0::bigint],
  'Ninguna leyenda se publica sin deck legendario'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_opponent_deck_entries
    where version_tier <> 5 or level <> 30$$,
  array[0::bigint],
  'El deck legendario viaja al tope de nivel y versión'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_opponents where is_active and ai_profile <> 'MYTHIC'$$,
  array[0::bigint],
  'Las leyendas usan el perfil MYTHIC como base'
);

-- 3 bis. Configuración versionada y identidad publicable de las leyendas.
select has_table('public', 'olympus_settings', 'Existe la configuración versionada del modo');
select results_eq(
  $$select count(*)::bigint from public.olympus_settings where is_active$$,
  array[1::bigint],
  'Existe exactamente una configuración activa'
);
select ok(
  not has_table_privilege('authenticated', 'public.olympus_settings', 'UPDATE'),
  'authenticated no puede editar el límite diario ni el coste de respec'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_opponents where is_active$$,
  array[3::bigint],
  'El Olimpo publica exactamente a Zeus, Loki y Hefes'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_opponents
    where is_active and (avatar_path is null or intro_path is null
      or victory_path is null or defeat_path is null)$$,
  array[0::bigint],
  'Cada leyenda activa trae su arte completo'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_opponents
    where is_active and (base_fragment_reward <= 0 or first_victory_fragment_bonus <= 0)$$,
  array[0::bigint],
  'Cada leyenda declara recompensa base y bonus de primera victoria'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_champions
    where base_scale_json ->> 'level' is null
      or base_scale_json ->> 'versionTier' is null
      or base_scale_json ->> 'startingLp' is null$$,
  array[0::bigint],
  'Cada campeón declara su escala base para el deck prestado'
);

-- 4. Mutaciones transaccionales: allowance, batallas y economía por campeón.
select lives_ok(
  $$insert into auth.users (id, aud, role, email)
    values ('00000000-0000-0000-0000-000000000501', 'authenticated', 'authenticated', 'olympus-domain@example.test')$$,
  'Se prepara un jugador aislado para las transacciones de Olimpo'
);
select lives_ok(
  $$insert into public.olympus_opponents
      (id, code, display_name, deck_template_id, ai_profile, reward_definition_id, available_until)
    select 'legendary-closed', 'LEGENDARY_CLOSED', 'Ventana Cerrada', deck_template_id, ai_profile,
      reward_definition_id, now() - interval '1 day'
    from public.olympus_opponents where is_active order by id limit 1$$,
  'Se publica una leyenda fuera de ventana para probar la disponibilidad'
);
select throws_ok(
  $$select public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000601',
    'helena', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-locked', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  'P0001',
  'CHAMPION_NOT_UNLOCKED',
  'Un campeón sin victoria verificada no puede combatir'
);
select results_eq(
  $$select public.grant_champion_unlock_from_arena_win(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 1, 'arena-win-1'
  )$$,
  array[true],
  'La victoria del tier uno desbloquea a GenNvim'
);
select throws_ok(
  $$select public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000601',
    'gennvim', 'legendary-closed', 'seed-closed', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  'P0001',
  'OLYMPUS_OPPONENT_UNAVAILABLE',
  'Una leyenda fuera de ventana no emite batalla'
);
select results_eq(
  $$select attempts_used::bigint from public.olympus_daily_usage
    where player_id = '00000000-0000-0000-0000-000000000501'$$,
  array[]::bigint[],
  'Los rechazos previos no consumen intento alguno'
);

-- 4.1. Economía del árbol antes de gastar intentos, para que el saldo sea comprobable.
select throws_ok(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'gennvim-power-1', 'olympus-upgrade-1'
  )$$,
  'P0001',
  'INSUFFICIENT_FRAGMENTS',
  'Sin Fragmentos no se compra ningún nodo'
);
select results_eq(
  $$select public.credit_ascension_fragments(
    '00000000-0000-0000-0000-000000000501', 'olympus-seed-fragments', 200, 'TEST_SETUP'
  )$$,
  array[200],
  'La cartera de Fragmentos se acredita para la prueba'
);
select results_eq(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'gennvim-power-1', 'olympus-upgrade-1'
  )$$,
  array[160],
  'La compra descuenta el coste del nodo'
);
select results_eq(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'gennvim-power-1', 'olympus-upgrade-1'
  )$$,
  array[160],
  'Repetir la compra con el mismo operation_id no vuelve a cobrar'
);
select lives_ok(
  $$insert into public.olympus_champion_upgrade_nodes
      (id, champion_id, branch, prerequisite_node_ids, effect_json, fragment_cost, sort_order)
    values ('gennvim-power-2', 'gennvim', 'POWER', array['gennvim-identity-1'],
      '{"kind":"GLOBAL_LEVEL","amount":5,"cap":30}'::jsonb, 40, 11)$$,
  'Se publica un nodo con prerrequisito para probar el orden del árbol'
);
select throws_ok(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'gennvim-power-2', 'olympus-upgrade-2'
  )$$,
  'P0001',
  'UPGRADE_PREREQUISITES_NOT_MET',
  'Un nodo con prerrequisito pendiente no se compra'
);
select results_eq(
  $$select public.respec_champion_upgrades(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'olympus-respec-1'
  )$$,
  array[190],
  'La primera reasignación es gratuita y solo devuelve el porcentaje configurado'
);
select is(
  (select unlocked_node_ids from public.player_olympus_champion_progress
    where player_id = '00000000-0000-0000-0000-000000000501' and champion_id = 'gennvim'),
  '{}'::text[],
  'El respec vacía el árbol del campeón'
);
select results_eq(
  $$select respec_count from public.player_olympus_champion_progress
    where player_id = '00000000-0000-0000-0000-000000000501' and champion_id = 'gennvim'$$,
  array[1],
  'El contador de reasignaciones queda auditado'
);
select results_eq(
  $$select public.purchase_champion_upgrade(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'gennvim-power-1', 'olympus-upgrade-3'
  )$$,
  array[150],
  'Se vuelve a invertir para probar la segunda reasignación'
);
select results_eq(
  $$select public.respec_champion_upgrades(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'olympus-respec-2'
  )$$,
  array[120],
  'La segunda reasignación cobra el coste configurado además de devolver el reembolso'
);
select results_eq(
  $$select amount from public.combat_mode_wallet_transactions
    where player_id = '00000000-0000-0000-0000-000000000501'
      and operation_id = 'olympus-respec-2:cost'$$,
  array[-60],
  'El cobro del respec deja su propio asiento de auditoría'
);
select throws_ok(
  $$select public.respec_champion_upgrades(
    '00000000-0000-0000-0000-000000000501', 'gennvim', 'olympus-respec-3'
  )$$,
  'P0001',
  'NO_UPGRADES_TO_RESPEC',
  'Reasignar un árbol vacío no genera Fragmentos de la nada'
);

-- 4.2. Allowance diario y unicidad de batalla activa.
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000601',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-1', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  array[1],
  'La emisión consume el primer intento del periodo'
);
select throws_ok(
  $$select public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000602',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-2', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  'P0001',
  'OLYMPUS_BATTLE_ALREADY_ISSUED',
  'Solo puede existir una batalla de Olimpo activa'
);
select results_eq(
  $$select status from public.complete_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000601',
    'WIN', '{"ascensionFragments":50}'::jsonb, 50
  )$$,
  array['COMPLETED'::text],
  'La victoria reproducida se persiste'
);
select results_eq(
  $$select outcome from public.complete_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000601',
    'LOSS', '{"ascensionFragments":0}'::jsonb, 0
  )$$,
  array['WIN'::text],
  'Reliquidar no reescribe el desenlace ya registrado'
);
select results_eq(
  $$select count(*)::bigint from public.combat_mode_wallet_transactions
    where player_id = '00000000-0000-0000-0000-000000000501'
      and operation_id = 'olympus-battle:00000000-0000-0000-0000-000000000601'$$,
  array[1::bigint],
  'La recompensa se acredita una sola vez por batalla'
);
select results_eq(
  $$select status from public.combat_sessions
    where battle_id = '00000000-0000-0000-0000-000000000601'$$,
  array['COMPLETED'::text],
  'La sesión autoritativa se cierra junto a la batalla'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_first_victories
    where player_id = '00000000-0000-0000-0000-000000000501'$$,
  array[1::bigint],
  'La primera victoria contra la leyenda se registra una vez'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000603',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-3', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  array[2],
  'El segundo intento se numera de forma consecutiva'
);
select results_eq(
  $$select status from public.complete_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000603',
    'WIN', '{"ascensionFragments":50}'::jsonb, 50
  )$$,
  array['COMPLETED'::text],
  'La segunda victoria también se liquida'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_first_victories
    where player_id = '00000000-0000-0000-0000-000000000501'$$,
  array[1::bigint],
  'Repetir leyenda no vuelve a pagar el bonus de primera victoria'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000604',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-4', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  array[3],
  'El tercer intento agota el allowance configurado'
);
select results_eq(
  $$select status from public.complete_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000604',
    'LOSS', '{"ascensionFragments":0}'::jsonb, 0
  )$$,
  array['COMPLETED'::text],
  'La derrota cierra la batalla sin recompensa premium'
);
select throws_ok(
  $$select public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000605',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-5', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  'P0001',
  'OLYMPUS_DAILY_LIMIT_REACHED',
  'El cuarto intento del día se rechaza en servidor'
);
select results_eq(
  $$select period_key from public.olympus_daily_usage
    where player_id = '00000000-0000-0000-0000-000000000501'$$,
  $$select (now() at time zone 'UTC')::date$$,
  'El periodo se deriva de la fecha UTC del servidor'
);

-- 4.3. Abandonar castiga; un snapshot incompatible devuelve el intento porque la culpa es nuestra.
select lives_ok(
  $$update public.olympus_daily_usage set daily_limit = 6
    where player_id = '00000000-0000-0000-0000-000000000501'$$,
  'Se amplía el allowance del fixture sin tocar las funciones bajo prueba'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000605',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-6', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  array[4],
  'Se emite un combate para probar el abandono'
);
select results_eq(
  $$select outcome from public.forfeit_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000605'
  )$$,
  array['LOSS'::text],
  'Abandonar una batalla jugable la cierra como derrota'
);
select results_eq(
  $$select outcome from public.forfeit_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000605'
  )$$,
  array['LOSS'::text],
  'Repetir el abandono es idempotente'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000606',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-7', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  array[5],
  'Se emite otro combate para probar la invalidación'
);
select lives_ok(
  $$select public.invalidate_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000606'
  )$$,
  'Un snapshot incompatible puede invalidarse de forma autoritativa'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_battles
    where battle_id = '00000000-0000-0000-0000-000000000606'$$,
  array[0::bigint],
  'La batalla incompatible deja de bloquear al jugador'
);
select results_eq(
  $$select attempts_used from public.olympus_daily_usage
    where player_id = '00000000-0000-0000-0000-000000000501'$$,
  array[4],
  'La invalidación devuelve el intento consumido'
);
select results_eq(
  $$select attempt_number from public.issue_olympus_battle(
    '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000607',
    'gennvim', (select id from public.olympus_opponents where is_active and id <> 'legendary-closed' order by id limit 1),
    'seed-olympus-8', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '{}'::jsonb, 3,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'cccccccccccccccccccccccccccccccc',
    now() + interval '45 minutes'
  )$$,
  array[5],
  'La reemisión reutiliza el intento devuelto'
);

select * from finish();
rollback;
