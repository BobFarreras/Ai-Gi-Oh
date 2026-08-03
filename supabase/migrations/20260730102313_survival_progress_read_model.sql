-- supabase/migrations/20260730102313_survival_progress_read_model.sql - Optimiza el récord Survival sin duplicar estado derivable.
create index if not exists idx_player_survival_runs_best_wins
on public.player_survival_runs (player_id, wins desc);
