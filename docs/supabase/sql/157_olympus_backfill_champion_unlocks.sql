-- docs/supabase/sql/157_olympus_backfill_champion_unlocks.sql - Concede los campeones ya ganados en Arena antes de que el desbloqueo existiera en runtime.
begin;

/**
 * La migración 150 dejó el desbloqueo listo en base de datos pero nadie lo llamaba desde el código: solo
 * se rellenaba con el backfill que corre DURANTE la propia migración. Cualquiera que se registrara después
 * podía ganar el ladder entero y seguir sin campeones, con Olimpo inaccesible.
 *
 * El cierre de combate ya concede el campeón (ver CompleteTrainingMatchUseCase). Esto recupera lo que los
 * jugadores existentes se habían ganado sin obligarles a repetirlo.
 *
 * Criterio, el mismo que en runtime: el ladder se pelea en orden, así que N victorias en un tier equivalen
 * a haber vencido a los N primeros rivales de ese tier.
 */
insert into public.player_olympus_champion_unlocks
  (player_id, champion_id, source_tier, source_battle_id)
select progress.player_id, champion.id, champion.required_tier, 'backfill-tier-' || champion.required_tier
from public.player_training_progress progress
join public.olympus_champions champion on champion.is_active
where exists (
  select 1
  from jsonb_array_elements(
    case when jsonb_typeof(progress.tier_stats) = 'array' then progress.tier_stats else '[]'::jsonb end
  ) stat
  where stat ->> 'tier' ~ '^[0-9]+$'
    and stat ->> 'wins' ~ '^[0-9]+$'
    and (stat ->> 'tier')::integer = champion.required_tier
    and (stat ->> 'wins')::integer >= champion.required_ladder_position
)
on conflict (player_id, champion_id) do nothing;

-- El progreso del árbol acompaña siempre al desbloqueo; sin él, comprar un nodo fallaría.
insert into public.player_olympus_champion_progress (player_id, champion_id)
select player_id, champion_id from public.player_olympus_champion_unlocks
on conflict (player_id, champion_id) do nothing;

commit;
