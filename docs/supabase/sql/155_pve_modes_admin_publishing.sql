-- docs/supabase/sql/155_pve_modes_admin_publishing.sql - Publica versiones nuevas de la configuración PvE sin tocar la que están usando las partidas en curso.
begin;

/**
 * Publicar es insertar una versión nueva y mover el flag activo en la misma transacción. Editar la fila
 * activa rompería las expediciones en curso: `player_survival_runs.ruleset_version` apunta a la versión
 * con la que empezó la run, y su escalado debe quedarse congelado.
 */
create function public.publish_survival_ruleset(
  p_start_tier integer,
  p_battles_per_tier integer,
  p_roster jsonb,
  p_milestone_interval integer,
  p_milestone_heal integer,
  p_stages jsonb
)
returns public.survival_rulesets
language plpgsql
set search_path = ''
as $$
declare
  next_version integer;
  published public.survival_rulesets;
begin
  if jsonb_typeof(p_roster) <> 'array' or jsonb_array_length(p_roster) = 0 then
    raise exception 'INVALID_SURVIVAL_ROSTER' using errcode = '22023';
  end if;
  if jsonb_typeof(p_stages) <> 'array' or jsonb_array_length(p_stages) = 0 then
    raise exception 'INVALID_SURVIVAL_STAGES' using errcode = '22023';
  end if;

  select coalesce(max(version), 0) + 1 into next_version from public.survival_rulesets;
  update public.survival_rulesets set is_active = false where is_active;

  insert into public.survival_rulesets
    (version, start_tier, battles_per_tier, roster_json, milestone_interval, milestone_heal, is_active)
  values
    (next_version, p_start_tier, p_battles_per_tier, p_roster, p_milestone_interval, p_milestone_heal, true)
  returning * into published;

  insert into public.survival_scaling_stages
    (ruleset_id, from_battle, ai_profile, card_scale_json, ascension_modifiers_json, reward_definition_id)
  select published.id,
    (stage ->> 'fromBattle')::integer,
    stage ->> 'aiProfile',
    coalesce(stage -> 'cardScale', '{}'::jsonb),
    coalesce(stage -> 'ascensionModifiers', '{}'::jsonb),
    stage ->> 'rewardDefinitionId'
  from jsonb_array_elements(p_stages) as stage;

  return published;
end;
$$;

create function public.publish_olympus_settings(
  p_daily_attempt_limit integer,
  p_battle_ttl_minutes integer,
  p_respec_free_allowance integer,
  p_respec_cost integer,
  p_respec_refund_percent integer
)
returns public.olympus_settings
language plpgsql
set search_path = ''
as $$
declare
  next_version integer;
  published public.olympus_settings;
begin
  select coalesce(max(version), 0) + 1 into next_version from public.olympus_settings;
  update public.olympus_settings set is_active = false where is_active;

  insert into public.olympus_settings
    (version, daily_attempt_limit, battle_ttl_minutes, respec_free_allowance,
     respec_cost, respec_refund_percent, is_active)
  values
    (next_version, p_daily_attempt_limit, p_battle_ttl_minutes, p_respec_free_allowance,
     p_respec_cost, p_respec_refund_percent, true)
  returning * into published;

  return published;
end;
$$;

revoke all on function public.publish_survival_ruleset(integer, integer, jsonb, integer, integer, jsonb)
from public, anon, authenticated;
revoke all on function public.publish_olympus_settings(integer, integer, integer, integer, integer)
from public, anon, authenticated;
grant execute on function public.publish_survival_ruleset(integer, integer, jsonb, integer, integer, jsonb) to service_role;
grant execute on function public.publish_olympus_settings(integer, integer, integer, integer, integer) to service_role;

commit;
