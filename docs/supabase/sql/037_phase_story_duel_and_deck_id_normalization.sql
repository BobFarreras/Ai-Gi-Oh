-- docs/supabase/sql/037_phase_story_duel_and_deck_id_normalization.sql - Normaliza IDs de mazos y duelos Story para mantener coherencia entre acto/capítulo/índice.
begin;

alter table public.story_duels
  drop constraint if exists story_duels_chapter_duel_index_key;

with deck_map(old_id, new_id) as (
  values
    ('deck-opp-ch1-apprentice-v1', 'deck-opp-gennvim-v1'),
    ('deck-opp-ch1-apprentice-v2', 'deck-opp-gennvim-v2'),
    ('deck-opp-ch1-biglog-v1', 'deck-opp-biglog-v1'),
    ('deck-opp-ch1-jaku-v1', 'deck-opp-jaku-v1'),
    ('deck-opp-ch1-helena-v1', 'deck-opp-helena-v1'),
    ('deck-opp-ch1-soldier-act01-v1', 'deck-opp-soldier-act01-v1')
)
insert into public.story_deck_lists (id, opponent_id, name, description, version, is_active, updated_at)
select
  deck_map.new_id,
  deck.opponent_id,
  deck.name,
  deck.description,
  deck.version,
  deck.is_active,
  deck.updated_at
from deck_map
join public.story_deck_lists deck on deck.id = deck_map.old_id
on conflict (id) do update set
  opponent_id = excluded.opponent_id,
  name = excluded.name,
  description = excluded.description,
  version = excluded.version,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

with deck_map(old_id, new_id) as (
  values
    ('deck-opp-ch1-apprentice-v1', 'deck-opp-gennvim-v1'),
    ('deck-opp-ch1-apprentice-v2', 'deck-opp-gennvim-v2'),
    ('deck-opp-ch1-biglog-v1', 'deck-opp-biglog-v1'),
    ('deck-opp-ch1-jaku-v1', 'deck-opp-jaku-v1'),
    ('deck-opp-ch1-helena-v1', 'deck-opp-helena-v1'),
    ('deck-opp-ch1-soldier-act01-v1', 'deck-opp-soldier-act01-v1')
)
update public.story_deck_list_cards card
set deck_list_id = deck_map.new_id
from deck_map
where card.deck_list_id = deck_map.old_id;

with deck_map(old_id, new_id) as (
  values
    ('deck-opp-ch1-apprentice-v1', 'deck-opp-gennvim-v1'),
    ('deck-opp-ch1-apprentice-v2', 'deck-opp-gennvim-v2'),
    ('deck-opp-ch1-biglog-v1', 'deck-opp-biglog-v1'),
    ('deck-opp-ch1-jaku-v1', 'deck-opp-jaku-v1'),
    ('deck-opp-ch1-helena-v1', 'deck-opp-helena-v1'),
    ('deck-opp-ch1-soldier-act01-v1', 'deck-opp-soldier-act01-v1')
)
update public.story_duels duel
set deck_list_id = deck_map.new_id
from deck_map
where duel.deck_list_id = deck_map.old_id;

delete from public.story_deck_lists
where id in (
  'deck-opp-ch1-apprentice-v1',
  'deck-opp-ch1-apprentice-v2',
  'deck-opp-ch1-biglog-v1',
  'deck-opp-ch1-jaku-v1',
  'deck-opp-ch1-helena-v1',
  'deck-opp-ch1-soldier-act01-v1'
);

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
insert into public.story_duels (
  id,
  chapter,
  duel_index,
  title,
  description,
  opponent_id,
  deck_list_id,
  opening_hand_size,
  starter_player,
  reward_nexus,
  reward_player_experience,
  unlock_requirement_duel_id,
  is_boss_duel,
  is_active,
  updated_at
)
select
  duel_stage_map.new_id,
  duel.chapter,
  duel.duel_index,
  duel.title,
  duel.description,
  duel.opponent_id,
  duel.deck_list_id,
  duel.opening_hand_size,
  duel.starter_player,
  duel.reward_nexus,
  duel.reward_player_experience,
  duel.unlock_requirement_duel_id,
  duel.is_boss_duel,
  duel.is_active,
  duel.updated_at
from duel_stage_map
join public.story_duels duel on duel.id = duel_stage_map.old_id
on conflict (id) do update set
  chapter = excluded.chapter,
  duel_index = excluded.duel_index,
  title = excluded.title,
  description = excluded.description,
  opponent_id = excluded.opponent_id,
  deck_list_id = excluded.deck_list_id,
  opening_hand_size = excluded.opening_hand_size,
  starter_player = excluded.starter_player,
  reward_nexus = excluded.reward_nexus,
  reward_player_experience = excluded.reward_player_experience,
  unlock_requirement_duel_id = excluded.unlock_requirement_duel_id,
  is_boss_duel = excluded.is_boss_duel,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
update public.story_duels duel
set unlock_requirement_duel_id = duel_stage_map.new_id
from duel_stage_map
where duel.unlock_requirement_duel_id = duel_stage_map.old_id;

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
update public.story_duel_ai_profiles profile
set duel_id = duel_stage_map.new_id
from duel_stage_map
where profile.duel_id = duel_stage_map.old_id;

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
update public.story_duel_deck_overrides deck_override
set duel_id = duel_stage_map.new_id
from duel_stage_map
where deck_override.duel_id = duel_stage_map.old_id;

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
update public.story_duel_reward_cards reward
set duel_id = duel_stage_map.new_id
from duel_stage_map
where reward.duel_id = duel_stage_map.old_id;

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
update public.player_story_duel_progress progress
set duel_id = duel_stage_map.new_id
from duel_stage_map
where progress.duel_id = duel_stage_map.old_id;

with duel_stage_map(old_id, new_id) as (
  values
    ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
    ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
)
update public.player_story_world_state state
set
  current_node_id = case when state.current_node_id = duel_stage_map.old_id then duel_stage_map.new_id else state.current_node_id end,
  visited_node_ids = array_replace(state.visited_node_ids, duel_stage_map.old_id, duel_stage_map.new_id),
  interacted_node_ids = array_replace(state.interacted_node_ids, duel_stage_map.old_id, duel_stage_map.new_id)
from duel_stage_map
where
  state.current_node_id = duel_stage_map.old_id
  or duel_stage_map.old_id = any(state.visited_node_ids)
  or duel_stage_map.old_id = any(state.interacted_node_ids);

do $$
begin
  if to_regclass('public.player_story_history_events') is not null then
    with duel_stage_map(old_id, new_id) as (
      values
        ('story-ch2-duel-3', 'tmp-story-ch1-duel-4'),
        ('story-ch2-duel-4', 'tmp-story-ch1-duel-5')
    )
    update public.player_story_history_events history
    set node_id = duel_stage_map.new_id
    from duel_stage_map
    where history.node_id = duel_stage_map.old_id;
  end if;
end $$;

delete from public.story_duels
where id in ('story-ch2-duel-3', 'story-ch2-duel-4');

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
insert into public.story_duels (
  id,
  chapter,
  duel_index,
  title,
  description,
  opponent_id,
  deck_list_id,
  opening_hand_size,
  starter_player,
  reward_nexus,
  reward_player_experience,
  unlock_requirement_duel_id,
  is_boss_duel,
  is_active,
  updated_at
)
select
  duel_map.new_id,
  duel.chapter,
  duel.duel_index,
  duel.title,
  duel.description,
  duel.opponent_id,
  duel.deck_list_id,
  duel.opening_hand_size,
  duel.starter_player,
  duel.reward_nexus,
  duel.reward_player_experience,
  duel.unlock_requirement_duel_id,
  duel.is_boss_duel,
  duel.is_active,
  duel.updated_at
from duel_map
join public.story_duels duel on duel.id = duel_map.old_id
on conflict (id) do update set
  chapter = excluded.chapter,
  duel_index = excluded.duel_index,
  title = excluded.title,
  description = excluded.description,
  opponent_id = excluded.opponent_id,
  deck_list_id = excluded.deck_list_id,
  opening_hand_size = excluded.opening_hand_size,
  starter_player = excluded.starter_player,
  reward_nexus = excluded.reward_nexus,
  reward_player_experience = excluded.reward_player_experience,
  unlock_requirement_duel_id = excluded.unlock_requirement_duel_id,
  is_boss_duel = excluded.is_boss_duel,
  is_active = excluded.is_active,
  updated_at = excluded.updated_at;

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
update public.story_duels duel
set unlock_requirement_duel_id = duel_map.new_id
from duel_map
where duel.unlock_requirement_duel_id = duel_map.old_id;

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
update public.story_duel_ai_profiles profile
set duel_id = duel_map.new_id
from duel_map
where profile.duel_id = duel_map.old_id;

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
update public.story_duel_deck_overrides deck_override
set duel_id = duel_map.new_id
from duel_map
where deck_override.duel_id = duel_map.old_id;

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
update public.story_duel_reward_cards reward
set duel_id = duel_map.new_id
from duel_map
where reward.duel_id = duel_map.old_id;

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
update public.player_story_duel_progress progress
set duel_id = duel_map.new_id
from duel_map
where progress.duel_id = duel_map.old_id;

with duel_map(old_id, new_id) as (
  values
    ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
    ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
    ('story-ch2-duel-5', 'story-ch2-duel-3'),
    ('story-ch2-duel-6', 'story-ch2-duel-4'),
    ('story-ch2-duel-7', 'story-ch2-duel-5'),
    ('story-ch2-duel-8', 'story-ch2-duel-6'),
    ('story-ch2-duel-9', 'story-ch2-duel-7')
)
update public.player_story_world_state state
set
  current_node_id = case when state.current_node_id = duel_map.old_id then duel_map.new_id else state.current_node_id end,
  visited_node_ids = array_replace(state.visited_node_ids, duel_map.old_id, duel_map.new_id),
  interacted_node_ids = array_replace(state.interacted_node_ids, duel_map.old_id, duel_map.new_id)
from duel_map
where
  state.current_node_id = duel_map.old_id
  or duel_map.old_id = any(state.visited_node_ids)
  or duel_map.old_id = any(state.interacted_node_ids);

do $$
begin
  if to_regclass('public.player_story_history_events') is not null then
    with duel_map(old_id, new_id) as (
      values
        ('tmp-story-ch1-duel-4', 'story-ch1-duel-4'),
        ('tmp-story-ch1-duel-5', 'story-ch1-duel-5'),
        ('story-ch2-duel-5', 'story-ch2-duel-3'),
        ('story-ch2-duel-6', 'story-ch2-duel-4'),
        ('story-ch2-duel-7', 'story-ch2-duel-5'),
        ('story-ch2-duel-8', 'story-ch2-duel-6'),
        ('story-ch2-duel-9', 'story-ch2-duel-7')
    )
    update public.player_story_history_events history
    set node_id = duel_map.new_id
    from duel_map
    where history.node_id = duel_map.old_id;
  end if;
end $$;

delete from public.story_duels
where id in (
  'tmp-story-ch1-duel-4',
  'tmp-story-ch1-duel-5',
  'story-ch2-duel-5',
  'story-ch2-duel-6',
  'story-ch2-duel-7',
  'story-ch2-duel-8',
  'story-ch2-duel-9'
);

alter table public.story_duels
  add constraint story_duels_chapter_duel_index_key unique (chapter, duel_index);

commit;
