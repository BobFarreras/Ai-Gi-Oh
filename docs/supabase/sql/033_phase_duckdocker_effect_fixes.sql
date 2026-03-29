-- docs/supabase/sql/033_phase_duckdocker_effect_fixes.sql - Corrige efectos de DuckDuckGo y Docker para que reflejen el comportamiento real esperado en duelo.
begin;

update public.cards_catalog
set
  effect = jsonb_build_object(
    'action', 'SET_CARD_DUEL_PROGRESS',
    'targetCardId', 'entity-duckduckgo',
    'level', 5,
    'versionTier', 5
  ),
  description = 'Ajusta DuckDuckGo a versión 5 y nivel 5 durante este combate.'
where id = 'exec-duckduckgo-power-up'
  and type = 'EXECUTION';

update public.cards_catalog
set
  effect = jsonb_build_object(
    'action', 'BOOST_DEFENSE_BY_CARD_ID',
    'targetCardId', 'entity-docker',
    'value', 1000
  ),
  description = 'Aumenta +1000 DEF de Docker durante este duelo.'
where id = 'exec-docker-defense-1000'
  and type = 'EXECUTION';

commit;

