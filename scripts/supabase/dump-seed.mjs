// scripts/supabase/dump-seed.mjs - Regenera supabase/seed.sql desde una BD fuente (UPSERTs idempotentes).
//
// Vuelca SOLO contenido esencial del juego (no datos de jugador, no cards_catalog —
// las cartas las gobiernan las migraciones). Pensado para que, tras cambiar contenido
// (precios, login, misiones, eventos, promos) en prod o local, regeneres el seed y lo
// commitees: los contribuidores lo reciben con `pnpm db:reset`.
//
// Uso:
//   pnpm db:seed:dump                      (lee de NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
//   SEED_SOURCE_URL=... SEED_SOURCE_KEY=... pnpm db:seed:dump   (p. ej. apuntar a prod)
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Carga mínima de .env.local / .env (sin dependencias) para poder correr standalone.
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.join(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

const url = process.env.SEED_SOURCE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SEED_SOURCE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan credenciales. Define NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (o SEED_SOURCE_URL/SEED_SOURCE_KEY).");
  process.exit(1);
}
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Orden FK-safe (padres antes que hijos). Todas dependen de cards_catalog, que crean las
// migraciones antes del seed. Se omiten deliberadamente `updated_at`/`created_at` (ruido, no
// contenido). `json`: columnas jsonb (se serializan con ::jsonb). `reload`: tabla sin clave
// natural (PK de identidad) → se vacía y reinserta en vez de UPSERT.
const TABLES = [
  { name: "market_card_listings", pk: ["id"], columns: ["id", "card_id", "rarity", "price_nexus", "stock", "is_available"], order: "id" },
  { name: "market_pack_definitions", pk: ["id"], columns: ["id", "name", "description", "price_nexus", "cards_per_pack", "pack_pool_id", "preview_card_ids", "is_available"], order: "id" },
  { name: "market_pack_pool_entries", pk: ["id"], columns: ["id", "pack_pool_id", "card_id", "rarity", "weight"], order: "id" },
  { name: "events", pk: ["id"], columns: ["id", "name", "description", "currency_name", "banner_url", "starts_at", "ends_at", "is_active"], order: "id" },
  { name: "event_point_rules", pk: ["event_id", "action_type"], columns: ["event_id", "action_type", "points_per"], order: "event_id" },
  { name: "event_shop_items", pk: ["id"], columns: ["id", "event_id", "card_id", "cost_points", "per_player_limit", "sort_order", "is_active"], order: "id" },
  { name: "mission_definitions", pk: ["id"], columns: ["id", "scope", "objective_type", "objective_param", "target_count", "reward_nexus", "reward_type", "event_id", "title", "description", "sort_order", "is_active"], order: "id" },
  { name: "featured_promotions", pk: ["id"], columns: ["id", "kind", "title", "body", "media_url", "cta_label", "cta_href", "sort_order", "is_active"], order: "id" },
  { name: "login_reward_calendar", pk: ["day_index"], columns: ["day_index", "reward_type", "reward_nexus", "reward_card_id", "label"], order: "day_index" },

  // Onboarding: plantilla de deck inicial (editable desde admin).
  { name: "starter_deck_template_slots", pk: ["template_key", "slot_index"], columns: ["template_key", "slot_index", "card_id", "is_active"], order: ["template_key", "slot_index"] },

  // Story (padres → hijos). story_duels se ordena por (chapter, duel_index) para respetar el
  // auto-FK unlock_requirement_duel_id (los prerequisitos se insertan antes en el mismo INSERT).
  { name: "story_opponents", pk: ["id"], columns: ["id", "display_name", "description", "avatar_url", "difficulty", "ai_profile", "is_active"], json: ["ai_profile"], order: "id" },
  { name: "story_deck_lists", pk: ["id"], columns: ["id", "opponent_id", "name", "description", "version", "is_active"], order: "id" },
  { name: "story_deck_list_cards", pk: ["deck_list_id", "slot_index"], columns: ["deck_list_id", "slot_index", "card_id", "copies"], order: ["deck_list_id", "slot_index"] },
  { name: "story_duels", pk: ["id"], columns: ["id", "chapter", "duel_index", "title", "description", "opponent_id", "deck_list_id", "opening_hand_size", "starter_player", "reward_nexus", "reward_player_experience", "unlock_requirement_duel_id", "is_boss_duel", "is_active"], order: ["chapter", "duel_index"] },
  { name: "story_duel_reward_cards", pk: ["duel_id", "card_id"], columns: ["duel_id", "card_id", "copies", "drop_rate", "is_guaranteed"], order: ["duel_id", "card_id"] },
  { name: "story_duel_ai_profiles", pk: ["duel_id"], columns: ["duel_id", "difficulty", "ai_profile", "is_active"], json: ["ai_profile"], order: "duel_id" },
  { name: "story_duel_deck_overrides", pk: ["duel_id", "slot_index"], columns: ["duel_id", "slot_index", "card_id", "copies", "version_tier", "level", "xp", "attack_override", "defense_override", "effect_override", "is_active"], json: ["effect_override"], order: ["duel_id", "slot_index"] },
  { name: "story_duel_fusion_cards", pk: ["duel_id", "slot_index"], columns: ["duel_id", "slot_index", "card_id", "is_active"], order: ["duel_id", "slot_index"] },

  // Arena (padres → hijos; arena_tiers al final por su FK a arena_opponents).
  { name: "arena_opponents", pk: ["id"], columns: ["id", "code_name", "display_name", "avatar_url", "intro_url", "story_opponent_id", "is_active", "sort_order"], order: "id" },
  { name: "arena_opponent_deck_variants", pk: ["id"], columns: ["id", "opponent_id", "label", "sort_order", "is_active"], order: "id" },
  { name: "arena_deck_variant_cards", reload: true, columns: ["variant_id", "card_id", "zone", "version_tier", "level", "xp", "sort_order"], order: ["variant_id", "sort_order"] },
  { name: "arena_tiers", pk: ["tier"], columns: ["tier", "code", "required_wins_in_previous_tier", "ai_difficulty", "opponent_id", "reward_multiplier", "is_active"], order: "tier" },
];

/** Codifica un valor JS a literal SQL para columnas NO-jsonb (arrays nativos incluidos). */
function toSqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      const text = String(item);
      return /[",\s{}]/.test(text) ? `"${text.replace(/(["\\])/g, "\\$1")}"` : text;
    });
    return `'{${items.join(",")}}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** Codifica un valor a literal jsonb (objeto/array JSON) con cast explícito. */
function toJsonbLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

/** Elige el codificador según si la columna es jsonb (declarada en table.json). */
function encodeCell(table, col, row) {
  return table.json?.includes(col) ? toJsonbLiteral(row[col]) : toSqlLiteral(row[col]);
}

function buildValues(table, rows) {
  return rows
    .map((row) => `(${table.columns.map((col) => encodeCell(table, col, row)).join(",")})`)
    .join(", ");
}

/** UPSERT idempotente por PK natural, o (reload) vaciar + reinsertar para tablas sin clave natural. */
function buildStatement(table, rows) {
  if (table.reload) {
    const wipe = `DELETE FROM public.${table.name};`;
    if (rows.length === 0) return wipe;
    return `${wipe}\nINSERT INTO public.${table.name} (${table.columns.join(",")}) VALUES ${buildValues(table, rows)};`;
  }
  if (rows.length === 0) return `-- (sin filas en ${table.name})`;
  const updates = table.columns
    .filter((col) => !table.pk.includes(col))
    .map((col) => `${col}=excluded.${col}`)
    .join(",");
  return `INSERT INTO public.${table.name} (${table.columns.join(",")}) VALUES ${buildValues(table, rows)} ON CONFLICT (${table.pk.join(",")}) DO UPDATE SET ${updates};`;
}

async function main() {
  const sections = [];
  for (const table of TABLES) {
    let query = client.from(table.name).select(table.columns.join(","));
    for (const col of Array.isArray(table.order) ? table.order : [table.order]) {
      query = query.order(col, { ascending: true });
    }
    const { data, error } = await query;
    if (error) throw new Error(`Error leyendo ${table.name}: ${error.message}`);
    sections.push(`-- ${table.name} (${data.length} filas)\n${buildStatement(table, data)}`);
  }
  const header = [
    "-- supabase/seed.sql - Contenido esencial del juego (capa de verdad para contribuidores).",
    "-- GENERADO por scripts/supabase/dump-seed.mjs. No incluye cards_catalog (lo gobiernan las",
    "-- migraciones) ni datos de jugador. Cubre mercado, eventos/misiones/promos/login, plantilla",
    "-- de deck inicial y TODO el contenido admin de Story y Arena. Se aplica con `pnpm db:reset`.",
    "",
    "begin;",
    "",
  ].join("\n");
  const body = sections.join("\n\n");
  const target = path.join(process.cwd(), "supabase", "seed.sql");
  fs.writeFileSync(target, `${header}${body}\n\ncommit;\n`, "utf8");
  console.log(`OK: seed.sql regenerado (${TABLES.length} tablas).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
