-- docs/security/sql/2026-04-03-supabase-least-privilege-hardening.sql - Endurece privilegios SQL para anon/authenticated con mínimo necesario y RLS.
begin;

-- Revoca privilegios amplios para roles cliente en todas las tablas públicas.
do $$
declare
  table_name text;
begin
  for table_name in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('revoke all on table public.%I from anon;', table_name);
    execute format('revoke all on table public.%I from authenticated;', table_name);
  end loop;
end
$$;

-- Catálogo y contenido narrativo: solo lectura para usuario autenticado.
grant select on table public.cards_catalog to authenticated;
grant select on table public.card_passive_skills to authenticated;
grant select on table public.card_mastery_passive_map to authenticated;
grant select on table public.market_card_listings to authenticated;
grant select on table public.market_pack_definitions to authenticated;
grant select on table public.market_pack_pool_entries to authenticated;
grant select on table public.starter_deck_template_slots to authenticated;
grant select on table public.story_opponents to authenticated;
grant select on table public.story_duels to authenticated;
grant select on table public.story_duel_ai_profiles to authenticated;
grant select on table public.story_duel_deck_overrides to authenticated;
grant select on table public.story_duel_reward_cards to authenticated;
grant select on table public.story_deck_lists to authenticated;
grant select on table public.story_deck_list_cards to authenticated;

-- Estado del jugador: lectura/escritura controlada por políticas RLS "own".
grant select, insert, update on table public.player_profiles to authenticated;
grant select, insert, update on table public.player_progress to authenticated;
grant select, insert, update on table public.player_wallets to authenticated;
grant select, insert, update on table public.player_collection_cards to authenticated;
grant select, insert, update on table public.player_deck_slots to authenticated;
grant select, insert, update on table public.player_fusion_deck_slots to authenticated;
grant select, insert, update on table public.player_card_progress to authenticated;
grant select, insert on table public.player_card_xp_batches to authenticated;
grant select, insert, update on table public.player_story_world_state to authenticated;
grant select, insert, update on table public.player_story_duel_progress to authenticated;
grant select, insert, update on table public.player_training_progress to authenticated;
grant select, insert on table public.player_training_match_claims to authenticated;
grant select, insert, update on table public.player_tutorial_node_progress to authenticated;
grant select, insert on table public.player_tutorial_reward_claims to authenticated;
grant select, insert on table public.market_transactions to authenticated;

-- Admin vía sesión autenticada + políticas "own" y chequeos de servicio.
grant select on table public.admin_users to authenticated;
grant select, insert on table public.admin_audit_log to authenticated;

-- No conceder DELETE a roles cliente. Mantenimiento destructivo queda en service_role.

commit;
