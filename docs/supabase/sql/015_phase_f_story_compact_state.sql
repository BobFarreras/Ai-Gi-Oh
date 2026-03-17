-- docs/supabase/sql/015_phase_f_story_compact_state.sql - Migra Story a estado compacto (nodo actual + visitados + interactuados).
alter table if exists public.player_story_world_state
  drop constraint if exists player_story_world_state_current_node_id_fkey;

alter table if exists public.player_story_world_state
  add column if not exists visited_node_ids text[] not null default '{}'::text[];

alter table if exists public.player_story_world_state
  add column if not exists interacted_node_ids text[] not null default '{}'::text[];

with visited as (
  select
    player_id,
    coalesce(array_agg(distinct node_id), '{}'::text[]) as visited_node_ids
  from public.player_story_history_events
  group by player_id
),
interacted as (
  select
    player_id,
    coalesce(array_agg(distinct node_id), '{}'::text[]) as interacted_node_ids
  from public.player_story_history_events
  where kind = 'INTERACTION'
  group by player_id
)
update public.player_story_world_state state
set
  visited_node_ids = coalesce(visited.visited_node_ids, '{}'::text[]),
  interacted_node_ids = coalesce(interacted.interacted_node_ids, '{}'::text[])
from visited
left join interacted on interacted.player_id = visited.player_id
where state.player_id = visited.player_id;
