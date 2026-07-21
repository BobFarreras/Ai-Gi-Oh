-- docs/supabase/sql/143_opponent_skill_ranks.sql
-- Habilidades de COMBATE asignadas a oponentes (Arena y Story), editables desde el admin panel. Reutiliza el
-- catálogo `character_skill_nodes` (árbol de habilidades del jugador): cada fila da a un oponente un nodo a un
-- rango. En v1 el combate solo consume los efectos de STATS (LP/energía); el resto de efectos se ignora.
-- Escritura solo service-role (patrón de tablas de valor); lectura pública (el combate PvE los necesita).
begin;

create table if not exists public.opponent_skill_ranks (
  opponent_id   text not null,
  opponent_type text not null check (opponent_type in ('arena', 'story')),
  node_id       text not null references public.character_skill_nodes (id) on delete cascade,
  rank          smallint not null check (rank >= 1),
  created_at    timestamptz not null default now(),
  primary key (opponent_id, opponent_type, node_id)
);

comment on table public.opponent_skill_ranks is
  'Habilidades de combate asignadas a oponentes (Arena/Story). Reutiliza character_skill_nodes; v1 aplica solo stats (LP/energía).';

create index if not exists opponent_skill_ranks_opponent_idx
  on public.opponent_skill_ranks (opponent_type, opponent_id);

alter table public.opponent_skill_ranks enable row level security;

-- Lectura pública (el runtime de combate carga los modificadores del rival).
drop policy if exists "opponent_skill_ranks_select_all" on public.opponent_skill_ranks;
create policy "opponent_skill_ranks_select_all" on public.opponent_skill_ranks
  for select using (true);

-- Escritura solo service-role (admin vía API server-side).
revoke all on public.opponent_skill_ranks from anon, authenticated;
grant select on public.opponent_skill_ranks to anon, authenticated;
grant all on public.opponent_skill_ranks to service_role;

commit;

-- Comprobación posterior:
--   select opponent_type, opponent_id, node_id, rank from public.opponent_skill_ranks order by 1, 2;
