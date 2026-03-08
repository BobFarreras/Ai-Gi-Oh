-- docs/supabase/sql/012_phase_4_extend_trap_trigger_constraint.sql - Amplía el CHECK de trigger para soportar trampas que reaccionan a otras trampas.
begin;

alter table public.cards_catalog
  drop constraint if exists cards_catalog_trigger_check;

alter table public.cards_catalog
  add constraint cards_catalog_trigger_check
  check (
    trigger is null
    or trigger in (
      'ON_OPPONENT_ATTACK_DECLARED',
      'ON_OPPONENT_EXECUTION_ACTIVATED',
      'ON_OPPONENT_TRAP_ACTIVATED'
    )
  );

commit;
