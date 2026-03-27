
\restrict MjDtuHLhEMsa6EnO8G4fMb7GDYxPO7VlRvciZDt6RfJVes2NqtquBZbRr02LoKc


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  computed_nickname text;
begin
  computed_nickname := split_part(coalesce(new.email, 'operador@aigi.local'), '@', 1);
  if computed_nickname is null or char_length(trim(computed_nickname)) < 3 then
    computed_nickname := 'Operador';
  end if;

  insert into public.player_profiles (player_id, nickname)
  values (new.id, left(trim(computed_nickname), 24))
  on conflict (player_id) do nothing;

  insert into public.player_progress (player_id)
  values (new.id)
  on conflict (player_id) do nothing;

  insert into public.player_wallets (player_id, nexus)
  values (new.id, 1000)
  on conflict (player_id) do nothing;

  insert into public.player_deck_slots (player_id, slot_index, card_id)
  select new.id, slot_index, null
  from generate_series(0, 19) as slot_index
  on conflict (player_id, slot_index) do nothing;

  insert into public.player_fusion_deck_slots (player_id, slot_index, card_id)
  select new.id, slot_index, null
  from generate_series(0, 1) as slot_index
  on conflict (player_id, slot_index) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "text" NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'ADMIN'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['ADMIN'::"text", 'SUPER_ADMIN'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_mastery_passive_map" (
    "card_id" "text" NOT NULL,
    "passive_skill_id" "text" NOT NULL,
    "priority" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_mastery_passive_map_priority_check" CHECK (("priority" > 0))
);


ALTER TABLE "public"."card_mastery_passive_map" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_passive_skills" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "effect" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."card_passive_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cards_catalog" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "type" "text" NOT NULL,
    "faction" "text" NOT NULL,
    "cost" integer NOT NULL,
    "attack" integer,
    "defense" integer,
    "archetype" "text",
    "trigger" "text",
    "bg_url" "text",
    "render_url" "text",
    "effect" "jsonb",
    "fusion_recipe_id" "text",
    "fusion_material_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "fusion_energy_requirement" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "schema_version" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cards_catalog_archetype_check" CHECK ((("archetype" IS NULL) OR ("archetype" = ANY (ARRAY['LLM'::"text", 'FRAMEWORK'::"text", 'DB'::"text", 'IDE'::"text", 'LANGUAGE'::"text", 'TOOL'::"text", 'SECURITY'::"text"])))),
    CONSTRAINT "cards_catalog_attack_check" CHECK ((("attack" IS NULL) OR ("attack" >= 0))),
    CONSTRAINT "cards_catalog_check" CHECK ((("type" = ANY (ARRAY['ENTITY'::"text", 'FUSION'::"text"])) OR (("attack" IS NULL) AND ("defense" IS NULL)))),
    CONSTRAINT "cards_catalog_check1" CHECK ((("type" = 'TRAP'::"text") OR ("trigger" IS NULL))),
    CONSTRAINT "cards_catalog_cost_check" CHECK (("cost" >= 0)),
    CONSTRAINT "cards_catalog_defense_check" CHECK ((("defense" IS NULL) OR ("defense" >= 0))),
    CONSTRAINT "cards_catalog_faction_check" CHECK (("faction" = ANY (ARRAY['OPEN_SOURCE'::"text", 'BIG_TECH'::"text", 'NO_CODE'::"text", 'NEUTRAL'::"text"]))),
    CONSTRAINT "cards_catalog_fusion_energy_requirement_check" CHECK ((("fusion_energy_requirement" IS NULL) OR ("fusion_energy_requirement" >= 0))),
    CONSTRAINT "cards_catalog_schema_version_check" CHECK (("schema_version" > 0)),
    CONSTRAINT "cards_catalog_trigger_check" CHECK ((("trigger" IS NULL) OR ("trigger" = ANY (ARRAY['ON_OPPONENT_ATTACK_DECLARED'::"text", 'ON_OPPONENT_EXECUTION_ACTIVATED'::"text", 'ON_OPPONENT_TRAP_ACTIVATED'::"text"])))),
    CONSTRAINT "cards_catalog_type_check" CHECK (("type" = ANY (ARRAY['ENTITY'::"text", 'EXECUTION'::"text", 'TRAP'::"text", 'FUSION'::"text", 'ENVIRONMENT'::"text"])))
);


ALTER TABLE "public"."cards_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_card_listings" (
    "id" "text" NOT NULL,
    "card_id" "text" NOT NULL,
    "rarity" "text" NOT NULL,
    "price_nexus" integer NOT NULL,
    "stock" integer,
    "is_available" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_card_listings_price_nexus_check" CHECK (("price_nexus" >= 0)),
    CONSTRAINT "market_card_listings_rarity_check" CHECK (("rarity" = ANY (ARRAY['COMMON'::"text", 'RARE'::"text", 'EPIC'::"text", 'LEGENDARY'::"text"]))),
    CONSTRAINT "market_card_listings_stock_check" CHECK ((("stock" IS NULL) OR ("stock" >= 0)))
);


ALTER TABLE "public"."market_card_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_pack_definitions" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "price_nexus" integer NOT NULL,
    "cards_per_pack" integer NOT NULL,
    "pack_pool_id" "text" NOT NULL,
    "preview_card_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_available" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_pack_definitions_cards_per_pack_check" CHECK (("cards_per_pack" > 0)),
    CONSTRAINT "market_pack_definitions_price_nexus_check" CHECK (("price_nexus" >= 0))
);


ALTER TABLE "public"."market_pack_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_pack_pool_entries" (
    "id" "text" NOT NULL,
    "pack_pool_id" "text" NOT NULL,
    "card_id" "text" NOT NULL,
    "rarity" "text" NOT NULL,
    "weight" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_pack_pool_entries_rarity_check" CHECK (("rarity" = ANY (ARRAY['COMMON'::"text", 'RARE'::"text", 'EPIC'::"text", 'LEGENDARY'::"text"]))),
    CONSTRAINT "market_pack_pool_entries_weight_check" CHECK (("weight" > 0))
);


ALTER TABLE "public"."market_pack_pool_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_transactions" (
    "id" "text" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount_nexus" integer NOT NULL,
    "purchased_item_id" "text" NOT NULL,
    "purchased_card_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "market_transactions_amount_nexus_check" CHECK (("amount_nexus" >= 0)),
    CONSTRAINT "market_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['BUY_CARD'::"text", 'BUY_PACK'::"text"])))
);


ALTER TABLE "public"."market_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_card_progress" (
    "player_id" "uuid" NOT NULL,
    "card_id" "text" NOT NULL,
    "version_tier" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 0 NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "mastery_passive_skill_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_card_progress_check" CHECK ((("version_tier" < 5) OR ("mastery_passive_skill_id" IS NOT NULL))),
    CONSTRAINT "player_card_progress_level_check" CHECK ((("level" >= 0) AND ("level" <= 30))),
    CONSTRAINT "player_card_progress_version_tier_check" CHECK ((("version_tier" >= 0) AND ("version_tier" <= 5))),
    CONSTRAINT "player_card_progress_xp_check" CHECK (("xp" >= 0))
);


ALTER TABLE "public"."player_card_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_card_xp_batches" (
    "player_id" "uuid" NOT NULL,
    "battle_id" "text" NOT NULL,
    "events_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_card_xp_batches_battle_id_check" CHECK (("char_length"(TRIM(BOTH FROM "battle_id")) > 0)),
    CONSTRAINT "player_card_xp_batches_events_count_check" CHECK (("events_count" >= 0))
);


ALTER TABLE "public"."player_card_xp_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_collection_cards" (
    "player_id" "uuid" NOT NULL,
    "card_id" "text" NOT NULL,
    "owned_copies" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_collection_cards_owned_copies_check" CHECK (("owned_copies" >= 0))
);


ALTER TABLE "public"."player_collection_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_deck_slots" (
    "player_id" "uuid" NOT NULL,
    "slot_index" integer NOT NULL,
    "card_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_deck_slots_slot_index_check" CHECK ((("slot_index" >= 0) AND ("slot_index" < 20)))
);


ALTER TABLE "public"."player_deck_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_fusion_deck_slots" (
    "player_id" "uuid" NOT NULL,
    "slot_index" integer NOT NULL,
    "card_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_fusion_deck_slots_slot_index_check" CHECK ((("slot_index" >= 0) AND ("slot_index" < 2)))
);


ALTER TABLE "public"."player_fusion_deck_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_profiles" (
    "player_id" "uuid" NOT NULL,
    "nickname" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_profiles_nickname_check" CHECK ((("char_length"(TRIM(BOTH FROM "nickname")) >= 3) AND ("char_length"(TRIM(BOTH FROM "nickname")) <= 24)))
);


ALTER TABLE "public"."player_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_progress" (
    "player_id" "uuid" NOT NULL,
    "has_completed_tutorial" boolean DEFAULT false NOT NULL,
    "medals" integer DEFAULT 0 NOT NULL,
    "story_chapter" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "player_experience" integer DEFAULT 0 NOT NULL,
    "has_seen_academy_intro" boolean DEFAULT false NOT NULL,
    "has_skipped_tutorial" boolean DEFAULT false NOT NULL,
    CONSTRAINT "player_progress_medals_check" CHECK (("medals" >= 0)),
    CONSTRAINT "player_progress_player_experience_check" CHECK (("player_experience" >= 0)),
    CONSTRAINT "player_progress_story_chapter_check" CHECK (("story_chapter" >= 1))
);


ALTER TABLE "public"."player_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_story_duel_progress" (
    "player_id" "uuid" NOT NULL,
    "duel_id" "text" NOT NULL,
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "best_result" "text" DEFAULT 'NOT_PLAYED'::"text" NOT NULL,
    "first_cleared_at" timestamp with time zone,
    "last_played_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_story_duel_progress_best_result_check" CHECK (("best_result" = ANY (ARRAY['NOT_PLAYED'::"text", 'LOST'::"text", 'WON'::"text"]))),
    CONSTRAINT "player_story_duel_progress_losses_check" CHECK (("losses" >= 0)),
    CONSTRAINT "player_story_duel_progress_wins_check" CHECK (("wins" >= 0))
);


ALTER TABLE "public"."player_story_duel_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_story_world_state" (
    "player_id" "uuid" NOT NULL,
    "current_node_id" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visited_node_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "interacted_node_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "public"."player_story_world_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_training_match_claims" (
    "player_id" "uuid" NOT NULL,
    "battle_id" "text" NOT NULL,
    "tier" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_training_match_claims_tier_check" CHECK (("tier" >= 1))
);


ALTER TABLE "public"."player_training_match_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_training_progress" (
    "player_id" "uuid" NOT NULL,
    "highest_unlocked_tier" integer DEFAULT 1 NOT NULL,
    "total_wins" integer DEFAULT 0 NOT NULL,
    "total_matches" integer DEFAULT 0 NOT NULL,
    "tier_stats" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_training_progress_highest_unlocked_tier_check" CHECK (("highest_unlocked_tier" >= 1)),
    CONSTRAINT "player_training_progress_total_matches_check" CHECK (("total_matches" >= 0)),
    CONSTRAINT "player_training_progress_total_wins_check" CHECK (("total_wins" >= 0))
);


ALTER TABLE "public"."player_training_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_tutorial_node_progress" (
    "player_id" "uuid" NOT NULL,
    "node_id" "text" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_tutorial_node_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_tutorial_reward_claims" (
    "player_id" "uuid" NOT NULL,
    "reward_kind" "text" NOT NULL,
    "reward_nexus" integer NOT NULL,
    "claimed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_tutorial_reward_claims_reward_kind_check" CHECK (("reward_kind" = 'NEXUS'::"text")),
    CONSTRAINT "player_tutorial_reward_claims_reward_nexus_check" CHECK (("reward_nexus" > 0))
);


ALTER TABLE "public"."player_tutorial_reward_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_wallets" (
    "player_id" "uuid" NOT NULL,
    "nexus" integer DEFAULT 1000 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_wallets_nexus_check" CHECK (("nexus" >= 0))
);


ALTER TABLE "public"."player_wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."starter_deck_template_slots" (
    "template_key" "text" NOT NULL,
    "slot_index" smallint NOT NULL,
    "card_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "starter_deck_template_slots_slot_index_check" CHECK ((("slot_index" >= 0) AND ("slot_index" < 20)))
);


ALTER TABLE "public"."starter_deck_template_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_deck_list_cards" (
    "deck_list_id" "text" NOT NULL,
    "slot_index" integer NOT NULL,
    "card_id" "text" NOT NULL,
    "copies" integer DEFAULT 1 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_deck_list_cards_copies_check" CHECK ((("copies" > 0) AND ("copies" <= 3))),
    CONSTRAINT "story_deck_list_cards_slot_index_check" CHECK ((("slot_index" >= 0) AND ("slot_index" < 60)))
);


ALTER TABLE "public"."story_deck_list_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_deck_lists" (
    "id" "text" NOT NULL,
    "opponent_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_deck_lists_version_check" CHECK (("version" > 0))
);


ALTER TABLE "public"."story_deck_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_duel_ai_profiles" (
    "duel_id" "text" NOT NULL,
    "difficulty" "text" NOT NULL,
    "ai_profile" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_duel_ai_profiles_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['ROOKIE'::"text", 'STANDARD'::"text", 'ELITE'::"text", 'BOSS'::"text", 'MYTHIC'::"text"])))
);


ALTER TABLE "public"."story_duel_ai_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_duel_deck_overrides" (
    "duel_id" "text" NOT NULL,
    "slot_index" integer NOT NULL,
    "card_id" "text" NOT NULL,
    "copies" integer DEFAULT 1 NOT NULL,
    "version_tier" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 0 NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "attack_override" integer,
    "defense_override" integer,
    "effect_override" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_duel_deck_overrides_attack_override_check" CHECK ((("attack_override" IS NULL) OR ("attack_override" >= 0))),
    CONSTRAINT "story_duel_deck_overrides_copies_check" CHECK ((("copies" > 0) AND ("copies" <= 3))),
    CONSTRAINT "story_duel_deck_overrides_defense_override_check" CHECK ((("defense_override" IS NULL) OR ("defense_override" >= 0))),
    CONSTRAINT "story_duel_deck_overrides_level_check" CHECK ((("level" >= 0) AND ("level" <= 30))),
    CONSTRAINT "story_duel_deck_overrides_slot_index_check" CHECK ((("slot_index" >= 0) AND ("slot_index" < 60))),
    CONSTRAINT "story_duel_deck_overrides_version_tier_check" CHECK ((("version_tier" >= 0) AND ("version_tier" <= 5))),
    CONSTRAINT "story_duel_deck_overrides_xp_check" CHECK (("xp" >= 0))
);


ALTER TABLE "public"."story_duel_deck_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_duel_reward_cards" (
    "duel_id" "text" NOT NULL,
    "card_id" "text" NOT NULL,
    "copies" integer DEFAULT 1 NOT NULL,
    "drop_rate" numeric(5,4) DEFAULT 1.0000 NOT NULL,
    "is_guaranteed" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_duel_reward_cards_check" CHECK (((("is_guaranteed" = true) AND ("drop_rate" = 1.0000)) OR ("is_guaranteed" = false))),
    CONSTRAINT "story_duel_reward_cards_copies_check" CHECK ((("copies" > 0) AND ("copies" <= 5))),
    CONSTRAINT "story_duel_reward_cards_drop_rate_check" CHECK ((("drop_rate" >= (0)::numeric) AND ("drop_rate" <= (1)::numeric)))
);


ALTER TABLE "public"."story_duel_reward_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_duels" (
    "id" "text" NOT NULL,
    "chapter" integer NOT NULL,
    "duel_index" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "opponent_id" "text" NOT NULL,
    "deck_list_id" "text" NOT NULL,
    "opening_hand_size" integer DEFAULT 4 NOT NULL,
    "starter_player" "text" DEFAULT 'PLAYER'::"text" NOT NULL,
    "reward_nexus" integer DEFAULT 0 NOT NULL,
    "reward_player_experience" integer DEFAULT 0 NOT NULL,
    "unlock_requirement_duel_id" "text",
    "is_boss_duel" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_duels_chapter_check" CHECK (("chapter" > 0)),
    CONSTRAINT "story_duels_duel_index_check" CHECK (("duel_index" > 0)),
    CONSTRAINT "story_duels_opening_hand_size_check" CHECK ((("opening_hand_size" > 0) AND ("opening_hand_size" <= 7))),
    CONSTRAINT "story_duels_reward_nexus_check" CHECK (("reward_nexus" >= 0)),
    CONSTRAINT "story_duels_reward_player_experience_check" CHECK (("reward_player_experience" >= 0)),
    CONSTRAINT "story_duels_starter_player_check" CHECK (("starter_player" = ANY (ARRAY['PLAYER'::"text", 'OPPONENT'::"text", 'RANDOM'::"text"])))
);


ALTER TABLE "public"."story_duels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_opponents" (
    "id" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "difficulty" "text" NOT NULL,
    "ai_profile" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "story_opponents_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['ROOKIE'::"text", 'STANDARD'::"text", 'ELITE'::"text", 'BOSS'::"text", 'MYTHIC'::"text"])))
);


ALTER TABLE "public"."story_opponents" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."card_mastery_passive_map"
    ADD CONSTRAINT "card_mastery_passive_map_pkey" PRIMARY KEY ("card_id", "passive_skill_id");



ALTER TABLE ONLY "public"."card_passive_skills"
    ADD CONSTRAINT "card_passive_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards_catalog"
    ADD CONSTRAINT "cards_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_card_listings"
    ADD CONSTRAINT "market_card_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_pack_definitions"
    ADD CONSTRAINT "market_pack_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_pack_pool_entries"
    ADD CONSTRAINT "market_pack_pool_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_transactions"
    ADD CONSTRAINT "market_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_card_progress"
    ADD CONSTRAINT "player_card_progress_pkey" PRIMARY KEY ("player_id", "card_id");



ALTER TABLE ONLY "public"."player_card_xp_batches"
    ADD CONSTRAINT "player_card_xp_batches_pkey" PRIMARY KEY ("player_id", "battle_id");



ALTER TABLE ONLY "public"."player_collection_cards"
    ADD CONSTRAINT "player_collection_cards_pkey" PRIMARY KEY ("player_id", "card_id");



ALTER TABLE ONLY "public"."player_deck_slots"
    ADD CONSTRAINT "player_deck_slots_pkey" PRIMARY KEY ("player_id", "slot_index");



ALTER TABLE ONLY "public"."player_fusion_deck_slots"
    ADD CONSTRAINT "player_fusion_deck_slots_pkey" PRIMARY KEY ("player_id", "slot_index");



ALTER TABLE ONLY "public"."player_profiles"
    ADD CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."player_progress"
    ADD CONSTRAINT "player_progress_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."player_story_duel_progress"
    ADD CONSTRAINT "player_story_duel_progress_pkey" PRIMARY KEY ("player_id", "duel_id");



ALTER TABLE ONLY "public"."player_story_world_state"
    ADD CONSTRAINT "player_story_world_state_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."player_training_match_claims"
    ADD CONSTRAINT "player_training_match_claims_pkey" PRIMARY KEY ("player_id", "battle_id");



ALTER TABLE ONLY "public"."player_training_progress"
    ADD CONSTRAINT "player_training_progress_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."player_tutorial_node_progress"
    ADD CONSTRAINT "player_tutorial_node_progress_pkey" PRIMARY KEY ("player_id", "node_id");



ALTER TABLE ONLY "public"."player_tutorial_reward_claims"
    ADD CONSTRAINT "player_tutorial_reward_claims_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."player_wallets"
    ADD CONSTRAINT "player_wallets_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."starter_deck_template_slots"
    ADD CONSTRAINT "starter_deck_template_slots_pkey" PRIMARY KEY ("template_key", "slot_index");



ALTER TABLE ONLY "public"."story_deck_list_cards"
    ADD CONSTRAINT "story_deck_list_cards_pkey" PRIMARY KEY ("deck_list_id", "slot_index");



ALTER TABLE ONLY "public"."story_deck_lists"
    ADD CONSTRAINT "story_deck_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_duel_ai_profiles"
    ADD CONSTRAINT "story_duel_ai_profiles_pkey" PRIMARY KEY ("duel_id");



ALTER TABLE ONLY "public"."story_duel_deck_overrides"
    ADD CONSTRAINT "story_duel_deck_overrides_pkey" PRIMARY KEY ("duel_id", "slot_index");



ALTER TABLE ONLY "public"."story_duel_reward_cards"
    ADD CONSTRAINT "story_duel_reward_cards_pkey" PRIMARY KEY ("duel_id", "card_id");



ALTER TABLE ONLY "public"."story_duels"
    ADD CONSTRAINT "story_duels_chapter_duel_index_key" UNIQUE ("chapter", "duel_index");



ALTER TABLE ONLY "public"."story_duels"
    ADD CONSTRAINT "story_duels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_opponents"
    ADD CONSTRAINT "story_opponents_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_audit_log_actor_created" ON "public"."admin_audit_log" USING "btree" ("actor_user_id", "created_at" DESC);



CREATE INDEX "idx_admin_users_active" ON "public"."admin_users" USING "btree" ("is_active");



CREATE INDEX "idx_card_mastery_passive_map_card" ON "public"."card_mastery_passive_map" USING "btree" ("card_id");



CREATE INDEX "idx_cards_catalog_archetype" ON "public"."cards_catalog" USING "btree" ("archetype");



CREATE INDEX "idx_cards_catalog_type" ON "public"."cards_catalog" USING "btree" ("type");



CREATE INDEX "idx_market_card_listings_card_id" ON "public"."market_card_listings" USING "btree" ("card_id");



CREATE INDEX "idx_market_pack_pool_entries_card" ON "public"."market_pack_pool_entries" USING "btree" ("card_id");



CREATE INDEX "idx_market_pack_pool_entries_pool" ON "public"."market_pack_pool_entries" USING "btree" ("pack_pool_id");



CREATE INDEX "idx_market_transactions_player_created_at" ON "public"."market_transactions" USING "btree" ("player_id", "created_at" DESC);



CREATE INDEX "idx_player_card_progress_card" ON "public"."player_card_progress" USING "btree" ("card_id");



CREATE INDEX "idx_player_card_progress_player" ON "public"."player_card_progress" USING "btree" ("player_id");



CREATE INDEX "idx_player_card_xp_batches_player" ON "public"."player_card_xp_batches" USING "btree" ("player_id");



CREATE INDEX "idx_player_story_duel_progress_player" ON "public"."player_story_duel_progress" USING "btree" ("player_id");



CREATE INDEX "idx_player_training_match_claims_player_created" ON "public"."player_training_match_claims" USING "btree" ("player_id", "created_at" DESC);



CREATE INDEX "idx_player_tutorial_nodes_player_completed" ON "public"."player_tutorial_node_progress" USING "btree" ("player_id", "completed_at" DESC);



CREATE INDEX "idx_starter_deck_template_slots_active" ON "public"."starter_deck_template_slots" USING "btree" ("template_key", "is_active", "slot_index");



CREATE INDEX "idx_story_deck_list_cards_card" ON "public"."story_deck_list_cards" USING "btree" ("card_id");



CREATE INDEX "idx_story_deck_lists_opponent" ON "public"."story_deck_lists" USING "btree" ("opponent_id");



CREATE INDEX "idx_story_duel_ai_profiles_active" ON "public"."story_duel_ai_profiles" USING "btree" ("is_active");



CREATE INDEX "idx_story_duel_deck_overrides_active" ON "public"."story_duel_deck_overrides" USING "btree" ("is_active");



CREATE INDEX "idx_story_duel_deck_overrides_card" ON "public"."story_duel_deck_overrides" USING "btree" ("card_id");



CREATE INDEX "idx_story_duel_deck_overrides_duel" ON "public"."story_duel_deck_overrides" USING "btree" ("duel_id");



CREATE INDEX "idx_story_duel_reward_cards_duel" ON "public"."story_duel_reward_cards" USING "btree" ("duel_id");



CREATE INDEX "idx_story_duels_chapter" ON "public"."story_duels" USING "btree" ("chapter", "duel_index");



CREATE INDEX "idx_story_duels_opponent" ON "public"."story_duels" USING "btree" ("opponent_id");



CREATE INDEX "idx_story_opponents_active" ON "public"."story_opponents" USING "btree" ("is_active");



CREATE OR REPLACE TRIGGER "admin_users_set_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "card_mastery_passive_map_set_updated_at" BEFORE UPDATE ON "public"."card_mastery_passive_map" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "card_passive_skills_set_updated_at" BEFORE UPDATE ON "public"."card_passive_skills" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "cards_catalog_set_updated_at" BEFORE UPDATE ON "public"."cards_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "market_card_listings_set_updated_at" BEFORE UPDATE ON "public"."market_card_listings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "market_pack_definitions_set_updated_at" BEFORE UPDATE ON "public"."market_pack_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "market_pack_pool_entries_set_updated_at" BEFORE UPDATE ON "public"."market_pack_pool_entries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_card_progress_set_updated_at" BEFORE UPDATE ON "public"."player_card_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_collection_cards_set_updated_at" BEFORE UPDATE ON "public"."player_collection_cards" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_deck_slots_set_updated_at" BEFORE UPDATE ON "public"."player_deck_slots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_fusion_deck_slots_set_updated_at" BEFORE UPDATE ON "public"."player_fusion_deck_slots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_profiles_set_updated_at" BEFORE UPDATE ON "public"."player_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_progress_set_updated_at" BEFORE UPDATE ON "public"."player_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_story_duel_progress_set_updated_at" BEFORE UPDATE ON "public"."player_story_duel_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_story_world_state_set_updated_at" BEFORE UPDATE ON "public"."player_story_world_state" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_training_progress_set_updated_at" BEFORE UPDATE ON "public"."player_training_progress" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "player_wallets_set_updated_at" BEFORE UPDATE ON "public"."player_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "starter_deck_template_slots_set_updated_at" BEFORE UPDATE ON "public"."starter_deck_template_slots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_deck_list_cards_set_updated_at" BEFORE UPDATE ON "public"."story_deck_list_cards" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_deck_lists_set_updated_at" BEFORE UPDATE ON "public"."story_deck_lists" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_duel_ai_profiles_set_updated_at" BEFORE UPDATE ON "public"."story_duel_ai_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_duel_deck_overrides_set_updated_at" BEFORE UPDATE ON "public"."story_duel_deck_overrides" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_duel_reward_cards_set_updated_at" BEFORE UPDATE ON "public"."story_duel_reward_cards" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_duels_set_updated_at" BEFORE UPDATE ON "public"."story_duels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "story_opponents_set_updated_at" BEFORE UPDATE ON "public"."story_opponents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_mastery_passive_map"
    ADD CONSTRAINT "card_mastery_passive_map_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."card_mastery_passive_map"
    ADD CONSTRAINT "card_mastery_passive_map_passive_skill_id_fkey" FOREIGN KEY ("passive_skill_id") REFERENCES "public"."card_passive_skills"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."market_card_listings"
    ADD CONSTRAINT "market_card_listings_card_id_fkey_catalog" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id");



ALTER TABLE ONLY "public"."market_pack_pool_entries"
    ADD CONSTRAINT "market_pack_pool_entries_card_id_fkey_catalog" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id");



ALTER TABLE ONLY "public"."market_transactions"
    ADD CONSTRAINT "market_transactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_card_progress"
    ADD CONSTRAINT "player_card_progress_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_card_progress"
    ADD CONSTRAINT "player_card_progress_mastery_passive_skill_id_fkey" FOREIGN KEY ("mastery_passive_skill_id") REFERENCES "public"."card_passive_skills"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."player_card_progress"
    ADD CONSTRAINT "player_card_progress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_card_xp_batches"
    ADD CONSTRAINT "player_card_xp_batches_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_collection_cards"
    ADD CONSTRAINT "player_collection_cards_card_id_fkey_catalog" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id");



ALTER TABLE ONLY "public"."player_collection_cards"
    ADD CONSTRAINT "player_collection_cards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_deck_slots"
    ADD CONSTRAINT "player_deck_slots_card_id_fkey_catalog" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id");



ALTER TABLE ONLY "public"."player_deck_slots"
    ADD CONSTRAINT "player_deck_slots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_fusion_deck_slots"
    ADD CONSTRAINT "player_fusion_deck_slots_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_profiles"
    ADD CONSTRAINT "player_profiles_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_progress"
    ADD CONSTRAINT "player_progress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_story_duel_progress"
    ADD CONSTRAINT "player_story_duel_progress_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "public"."story_duels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_story_duel_progress"
    ADD CONSTRAINT "player_story_duel_progress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_story_world_state"
    ADD CONSTRAINT "player_story_world_state_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_training_match_claims"
    ADD CONSTRAINT "player_training_match_claims_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_training_progress"
    ADD CONSTRAINT "player_training_progress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_tutorial_node_progress"
    ADD CONSTRAINT "player_tutorial_node_progress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_tutorial_reward_claims"
    ADD CONSTRAINT "player_tutorial_reward_claims_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_wallets"
    ADD CONSTRAINT "player_wallets_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."starter_deck_template_slots"
    ADD CONSTRAINT "starter_deck_template_slots_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id");



ALTER TABLE ONLY "public"."story_deck_list_cards"
    ADD CONSTRAINT "story_deck_list_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."story_deck_list_cards"
    ADD CONSTRAINT "story_deck_list_cards_deck_list_id_fkey" FOREIGN KEY ("deck_list_id") REFERENCES "public"."story_deck_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_deck_lists"
    ADD CONSTRAINT "story_deck_lists_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "public"."story_opponents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_duel_ai_profiles"
    ADD CONSTRAINT "story_duel_ai_profiles_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "public"."story_duels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_duel_deck_overrides"
    ADD CONSTRAINT "story_duel_deck_overrides_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."story_duel_deck_overrides"
    ADD CONSTRAINT "story_duel_deck_overrides_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "public"."story_duels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_duel_reward_cards"
    ADD CONSTRAINT "story_duel_reward_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards_catalog"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."story_duel_reward_cards"
    ADD CONSTRAINT "story_duel_reward_cards_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "public"."story_duels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_duels"
    ADD CONSTRAINT "story_duels_deck_list_id_fkey" FOREIGN KEY ("deck_list_id") REFERENCES "public"."story_deck_lists"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."story_duels"
    ADD CONSTRAINT "story_duels_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "public"."story_opponents"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."story_duels"
    ADD CONSTRAINT "story_duels_unlock_requirement_duel_id_fkey" FOREIGN KEY ("unlock_requirement_duel_id") REFERENCES "public"."story_duels"("id") ON DELETE SET NULL;



ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_audit_log_insert_own" ON "public"."admin_audit_log" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "actor_user_id"));



CREATE POLICY "admin_audit_log_select_own" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "actor_user_id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_users_select_own_active" ON "public"."admin_users" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("is_active" = true)));



ALTER TABLE "public"."card_mastery_passive_map" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_mastery_passive_map_select_public" ON "public"."card_mastery_passive_map" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."card_passive_skills" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_passive_skills_select_public" ON "public"."card_passive_skills" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."cards_catalog" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cards_catalog_select_public" ON "public"."cards_catalog" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."market_card_listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "market_card_listings_select_public" ON "public"."market_card_listings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."market_pack_definitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "market_pack_definitions_select_public" ON "public"."market_pack_definitions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."market_pack_pool_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "market_pack_pool_entries_select_public" ON "public"."market_pack_pool_entries" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."market_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "market_transactions_insert_own" ON "public"."market_transactions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "market_transactions_select_own" ON "public"."market_transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_card_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_card_progress_insert_own" ON "public"."player_card_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_card_progress_select_own" ON "public"."player_card_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_card_progress_update_own" ON "public"."player_card_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_card_xp_batches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_card_xp_batches_insert_own" ON "public"."player_card_xp_batches" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_card_xp_batches_select_own" ON "public"."player_card_xp_batches" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_collection_cards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_collection_cards_insert_own" ON "public"."player_collection_cards" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_collection_cards_select_own" ON "public"."player_collection_cards" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_collection_cards_update_own" ON "public"."player_collection_cards" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_deck_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_deck_slots_insert_own" ON "public"."player_deck_slots" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_deck_slots_select_own" ON "public"."player_deck_slots" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_deck_slots_update_own" ON "public"."player_deck_slots" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_fusion_deck_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_fusion_deck_slots_insert_own" ON "public"."player_fusion_deck_slots" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_fusion_deck_slots_select_own" ON "public"."player_fusion_deck_slots" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_fusion_deck_slots_update_own" ON "public"."player_fusion_deck_slots" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_profiles_insert_own" ON "public"."player_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_profiles_select_own" ON "public"."player_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_profiles_update_own" ON "public"."player_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_progress_insert_own" ON "public"."player_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_progress_select_own" ON "public"."player_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_progress_update_own" ON "public"."player_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_story_duel_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_story_duel_progress_insert_own" ON "public"."player_story_duel_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_story_duel_progress_select_own" ON "public"."player_story_duel_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_story_duel_progress_update_own" ON "public"."player_story_duel_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_story_world_state" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_story_world_state_insert_own" ON "public"."player_story_world_state" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_story_world_state_select_own" ON "public"."player_story_world_state" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_story_world_state_update_own" ON "public"."player_story_world_state" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_training_match_claims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_training_match_claims_insert_own" ON "public"."player_training_match_claims" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_training_match_claims_select_own" ON "public"."player_training_match_claims" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_training_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_training_progress_insert_own" ON "public"."player_training_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_training_progress_select_own" ON "public"."player_training_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_training_progress_update_own" ON "public"."player_training_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_tutorial_node_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_tutorial_node_progress_insert_own" ON "public"."player_tutorial_node_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_tutorial_node_progress_select_own" ON "public"."player_tutorial_node_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_tutorial_node_progress_update_own" ON "public"."player_tutorial_node_progress" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_tutorial_reward_claims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_tutorial_reward_claims_insert_own" ON "public"."player_tutorial_reward_claims" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_tutorial_reward_claims_select_own" ON "public"."player_tutorial_reward_claims" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."player_wallets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_wallets_insert_own" ON "public"."player_wallets" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "player_wallets_select_own" ON "public"."player_wallets" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "player_id"));



CREATE POLICY "player_wallets_update_own" ON "public"."player_wallets" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "player_id")) WITH CHECK (("auth"."uid"() = "player_id"));



ALTER TABLE "public"."starter_deck_template_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "starter_deck_template_slots_select_authenticated" ON "public"."starter_deck_template_slots" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."story_deck_list_cards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_deck_list_cards_select_public" ON "public"."story_deck_list_cards" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."story_deck_lists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_deck_lists_select_public" ON "public"."story_deck_lists" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."story_duel_ai_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_duel_ai_profiles_select_public" ON "public"."story_duel_ai_profiles" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."story_duel_deck_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_duel_deck_overrides_select_public" ON "public"."story_duel_deck_overrides" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."story_duel_reward_cards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_duel_reward_cards_select_public" ON "public"."story_duel_reward_cards" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."story_duels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_duels_select_public" ON "public"."story_duels" FOR SELECT TO "authenticated" USING (("is_active" = true));



ALTER TABLE "public"."story_opponents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_opponents_select_public" ON "public"."story_opponents" FOR SELECT TO "authenticated" USING (("is_active" = true));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."card_mastery_passive_map" TO "anon";
GRANT ALL ON TABLE "public"."card_mastery_passive_map" TO "authenticated";
GRANT ALL ON TABLE "public"."card_mastery_passive_map" TO "service_role";



GRANT ALL ON TABLE "public"."card_passive_skills" TO "anon";
GRANT ALL ON TABLE "public"."card_passive_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."card_passive_skills" TO "service_role";



GRANT ALL ON TABLE "public"."cards_catalog" TO "anon";
GRANT ALL ON TABLE "public"."cards_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."cards_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."market_card_listings" TO "anon";
GRANT ALL ON TABLE "public"."market_card_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."market_card_listings" TO "service_role";



GRANT ALL ON TABLE "public"."market_pack_definitions" TO "anon";
GRANT ALL ON TABLE "public"."market_pack_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."market_pack_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."market_pack_pool_entries" TO "anon";
GRANT ALL ON TABLE "public"."market_pack_pool_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."market_pack_pool_entries" TO "service_role";



GRANT ALL ON TABLE "public"."market_transactions" TO "anon";
GRANT ALL ON TABLE "public"."market_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."market_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."player_card_progress" TO "anon";
GRANT ALL ON TABLE "public"."player_card_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."player_card_progress" TO "service_role";



GRANT ALL ON TABLE "public"."player_card_xp_batches" TO "anon";
GRANT ALL ON TABLE "public"."player_card_xp_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."player_card_xp_batches" TO "service_role";



GRANT ALL ON TABLE "public"."player_collection_cards" TO "anon";
GRANT ALL ON TABLE "public"."player_collection_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."player_collection_cards" TO "service_role";



GRANT ALL ON TABLE "public"."player_deck_slots" TO "anon";
GRANT ALL ON TABLE "public"."player_deck_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."player_deck_slots" TO "service_role";



GRANT ALL ON TABLE "public"."player_fusion_deck_slots" TO "anon";
GRANT ALL ON TABLE "public"."player_fusion_deck_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."player_fusion_deck_slots" TO "service_role";



GRANT ALL ON TABLE "public"."player_profiles" TO "anon";
GRANT ALL ON TABLE "public"."player_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."player_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."player_progress" TO "anon";
GRANT ALL ON TABLE "public"."player_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."player_progress" TO "service_role";



GRANT ALL ON TABLE "public"."player_story_duel_progress" TO "anon";
GRANT ALL ON TABLE "public"."player_story_duel_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."player_story_duel_progress" TO "service_role";



GRANT ALL ON TABLE "public"."player_story_world_state" TO "anon";
GRANT ALL ON TABLE "public"."player_story_world_state" TO "authenticated";
GRANT ALL ON TABLE "public"."player_story_world_state" TO "service_role";



GRANT ALL ON TABLE "public"."player_training_match_claims" TO "anon";
GRANT ALL ON TABLE "public"."player_training_match_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."player_training_match_claims" TO "service_role";



GRANT ALL ON TABLE "public"."player_training_progress" TO "anon";
GRANT ALL ON TABLE "public"."player_training_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."player_training_progress" TO "service_role";



GRANT ALL ON TABLE "public"."player_tutorial_node_progress" TO "anon";
GRANT ALL ON TABLE "public"."player_tutorial_node_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."player_tutorial_node_progress" TO "service_role";



GRANT ALL ON TABLE "public"."player_tutorial_reward_claims" TO "anon";
GRANT ALL ON TABLE "public"."player_tutorial_reward_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."player_tutorial_reward_claims" TO "service_role";



GRANT ALL ON TABLE "public"."player_wallets" TO "anon";
GRANT ALL ON TABLE "public"."player_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."player_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."starter_deck_template_slots" TO "anon";
GRANT ALL ON TABLE "public"."starter_deck_template_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."starter_deck_template_slots" TO "service_role";



GRANT ALL ON TABLE "public"."story_deck_list_cards" TO "anon";
GRANT ALL ON TABLE "public"."story_deck_list_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."story_deck_list_cards" TO "service_role";



GRANT ALL ON TABLE "public"."story_deck_lists" TO "anon";
GRANT ALL ON TABLE "public"."story_deck_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."story_deck_lists" TO "service_role";



GRANT ALL ON TABLE "public"."story_duel_ai_profiles" TO "anon";
GRANT ALL ON TABLE "public"."story_duel_ai_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."story_duel_ai_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."story_duel_deck_overrides" TO "anon";
GRANT ALL ON TABLE "public"."story_duel_deck_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."story_duel_deck_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."story_duel_reward_cards" TO "anon";
GRANT ALL ON TABLE "public"."story_duel_reward_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."story_duel_reward_cards" TO "service_role";



GRANT ALL ON TABLE "public"."story_duels" TO "anon";
GRANT ALL ON TABLE "public"."story_duels" TO "authenticated";
GRANT ALL ON TABLE "public"."story_duels" TO "service_role";



GRANT ALL ON TABLE "public"."story_opponents" TO "anon";
GRANT ALL ON TABLE "public"."story_opponents" TO "authenticated";
GRANT ALL ON TABLE "public"."story_opponents" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






\unrestrict MjDtuHLhEMsa6EnO8G4fMb7GDYxPO7VlRvciZDt6RfJVes2NqtquBZbRr02LoKc

RESET ALL;
