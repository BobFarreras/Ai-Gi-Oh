-- docs/supabase/sql/036_phase_story_opponent_id_normalization.sql - Normaliza IDs de oponentes Story para desacoplarlos del capítulo inicial.
begin;

with rename_map(old_id, new_id) as (
  values
    ('opp-ch1-apprentice', 'opp-gennvim'),
    ('opp-ch1-biglog', 'opp-biglog'),
    ('opp-ch1-jaku', 'opp-jaku'),
    ('opp-ch1-helena', 'opp-helena'),
    ('opp-ch1-soldier-act01', 'opp-soldier-act01')
)
insert into public.story_opponents (id, display_name, description, avatar_url, difficulty, ai_profile, is_active)
select
  rename_map.new_id,
  opponent.display_name,
  opponent.description,
  opponent.avatar_url,
  opponent.difficulty,
  opponent.ai_profile,
  opponent.is_active
from rename_map
join public.story_opponents opponent on opponent.id = rename_map.old_id
on conflict (id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  avatar_url = excluded.avatar_url,
  difficulty = excluded.difficulty,
  ai_profile = excluded.ai_profile,
  is_active = excluded.is_active;

with rename_map(old_id, new_id) as (
  values
    ('opp-ch1-apprentice', 'opp-gennvim'),
    ('opp-ch1-biglog', 'opp-biglog'),
    ('opp-ch1-jaku', 'opp-jaku'),
    ('opp-ch1-helena', 'opp-helena'),
    ('opp-ch1-soldier-act01', 'opp-soldier-act01')
)
update public.story_deck_lists deck
set opponent_id = rename_map.new_id
from rename_map
where deck.opponent_id = rename_map.old_id;

with rename_map(old_id, new_id) as (
  values
    ('opp-ch1-apprentice', 'opp-gennvim'),
    ('opp-ch1-biglog', 'opp-biglog'),
    ('opp-ch1-jaku', 'opp-jaku'),
    ('opp-ch1-helena', 'opp-helena'),
    ('opp-ch1-soldier-act01', 'opp-soldier-act01')
)
update public.story_duels duel
set opponent_id = rename_map.new_id
from rename_map
where duel.opponent_id = rename_map.old_id;

delete from public.story_opponents
where id in (
  'opp-ch1-apprentice',
  'opp-ch1-biglog',
  'opp-ch1-jaku',
  'opp-ch1-helena',
  'opp-ch1-soldier-act01'
);

commit;
