-- supabase/migrations/20260730094827_allow_reissued_survival_battle_index.sql - Permite renovar un encuentro expirado sin perder historial.
begin;

alter table public.survival_battles
drop constraint survival_battles_run_id_battle_index_key;

create unique index survival_battles_one_effective_attempt_idx
on public.survival_battles (run_id, battle_index)
where status <> 'EXPIRED';

commit;
