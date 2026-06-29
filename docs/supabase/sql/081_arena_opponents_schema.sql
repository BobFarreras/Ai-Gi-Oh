-- docs/supabase/sql/081_arena_opponents_schema.sql - Tablas para oponentes/decks/tiers de arena editables desde admin.
CREATE TABLE IF NOT EXISTS arena_opponents (
  id text PRIMARY KEY,
  code_name text NOT NULL,
  display_name text NOT NULL,
  avatar_url text NOT NULL,
  intro_url text NOT NULL,
  story_opponent_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS arena_opponent_deck_variants (
  id text PRIMARY KEY,
  opponent_id text NOT NULL REFERENCES arena_opponents(id) ON DELETE CASCADE,
  label text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS arena_deck_variant_cards (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  variant_id text NOT NULL REFERENCES arena_opponent_deck_variants(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  zone text NOT NULL CHECK (zone IN ('DECK','FUSION')),
  version_tier int,
  level int,
  xp int,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS arena_tiers (
  tier int PRIMARY KEY,
  code text NOT NULL,
  required_wins_in_previous_tier int NOT NULL DEFAULT 0,
  ai_difficulty text NOT NULL,
  opponent_id text NOT NULL REFERENCES arena_opponents(id),
  reward_multiplier numeric NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arena_variants_opponent ON arena_opponent_deck_variants(opponent_id);
CREATE INDEX IF NOT EXISTS idx_arena_variant_cards_variant ON arena_deck_variant_cards(variant_id);

ALTER TABLE arena_opponents ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_opponent_deck_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_deck_variant_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE arena_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY arena_opponents_select_all ON arena_opponents FOR SELECT TO authenticated USING (true);
CREATE POLICY arena_variants_select_all ON arena_opponent_deck_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY arena_variant_cards_select_all ON arena_deck_variant_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY arena_tiers_select_all ON arena_tiers FOR SELECT TO authenticated USING (true);
