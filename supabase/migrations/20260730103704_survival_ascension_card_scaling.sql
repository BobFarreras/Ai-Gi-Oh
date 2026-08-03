-- supabase/migrations/20260730103704_survival_ascension_card_scaling.sql - Configura refuerzo de cartas para runs Survival extensas.
update public.survival_scaling_stages stage
set ascension_modifiers_json = coalesce(stage.ascension_modifiers_json, '{}'::jsonb)
  || jsonb_build_object(
    'statBonusPerRank',
    case
      when stage.ai_profile = 'MYTHIC' then 175
      when stage.ai_profile = 'MASTER' then 150
      when stage.ai_profile = 'BOSS' then 125
      else 75
    end
  )
where stage.ruleset_id in (
  select ruleset.id
  from public.survival_rulesets ruleset
  where ruleset.version = 1
);
