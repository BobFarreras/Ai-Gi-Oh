-- supabase/tests/database/pve_modes_admin.test.sql - Verifica que publicar configuración PvE crea versión nueva y no toca la que usan las partidas en curso.
begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_function('public', 'publish_survival_ruleset', 'Existe la publicación versionada de Supervivencia');
select has_function('public', 'publish_olympus_settings', 'Existe la publicación versionada de Olimpo');
select ok(
  not has_function_privilege(
    'authenticated',
    'public.publish_survival_ruleset(integer,integer,jsonb,integer,integer,jsonb)',
    'EXECUTE'
  ),
  'authenticated no puede publicar reglas de Supervivencia'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.publish_olympus_settings(integer,integer,integer,integer,integer)',
    'EXECUTE'
  ),
  'authenticated no puede publicar la configuración de Olimpo'
);

-- Olimpo: publicar sustituye la configuración activa sin borrar la anterior.
select results_eq(
  $$select version from public.publish_olympus_settings(5, 60, 2, 120, 50)$$,
  array[2],
  'La publicación numera la versión siguiente'
);
select results_eq(
  $$select count(*)::bigint from public.olympus_settings where is_active$$,
  array[1::bigint],
  'Sigue existiendo una sola configuración activa'
);
select results_eq(
  $$select daily_attempt_limit, respec_cost from public.olympus_settings where is_active$$,
  $$values (5, 120)$$,
  'La configuración activa es la recién publicada'
);
select results_eq(
  $$select is_active from public.olympus_settings where version = 1$$,
  array[false],
  'La versión anterior queda archivada, no borrada'
);

-- Supervivencia: la run en curso conserva su ruleset histórico aunque se publique otro.
select lives_ok(
  $$insert into auth.users (id, aud, role, email)
    values ('00000000-0000-0000-0000-000000000701', 'authenticated', 'authenticated', 'pve-admin@example.test')$$,
  'Se prepara un jugador con expedición activa'
);
select results_eq(
  $$select ruleset_version from public.start_survival_run(
    '00000000-0000-0000-0000-000000000701', 8000, 1
  )$$,
  array[1],
  'La expedición nace atada a la versión vigente'
);
select results_eq(
  $$select version from public.publish_survival_ruleset(
    6, 3, '["training-tier-1","training-gokernel"]'::jsonb, 4, 1500,
    '[{"fromBattle":1,"aiProfile":"BOSS","cardScale":{"maxTier":8},
       "ascensionModifiers":{"maxLpBonus":500},"rewardDefinitionId":"survival-v2-base"}]'::jsonb
  )$$,
  array[2],
  'Supervivencia publica su versión siguiente'
);
select results_eq(
  $$select start_tier, milestone_heal from public.survival_rulesets where is_active$$,
  $$values (6, 1500)$$,
  'El ruleset activo pasa a ser el nuevo'
);
select results_eq(
  $$select count(*)::bigint from public.survival_scaling_stages stage
    join public.survival_rulesets ruleset on ruleset.id = stage.ruleset_id
    where ruleset.version = 2$$,
  array[1::bigint],
  'Los tramos de escalado viajan con su ruleset'
);
select results_eq(
  $$select ruleset_version from public.player_survival_runs
    where player_id = '00000000-0000-0000-0000-000000000701' and status = 'ACTIVE'$$,
  array[1],
  'La expedición en curso no se reescala al publicar'
);
select throws_ok(
  $$select public.publish_survival_ruleset(4, 2, '[]'::jsonb, 5, 2000, '[]'::jsonb)$$,
  '22023',
  'INVALID_SURVIVAL_ROSTER',
  'Un roster vacío no se publica'
);
select throws_ok(
  $$select public.publish_survival_ruleset(4, 2, '["training-tier-1"]'::jsonb, 5, 2000, '[]'::jsonb)$$,
  '22023',
  'INVALID_SURVIVAL_STAGES',
  'Un escalado vacío no se publica'
);

select * from finish();
rollback;
