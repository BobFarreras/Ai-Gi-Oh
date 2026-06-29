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

// Orden FK-safe. Todas dependen de cards_catalog, que crean las migraciones antes del seed.
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
];

/** Codifica un valor JS a literal SQL. No hay columnas jsonb en estas tablas (cards_catalog se excluye). */
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

function buildUpsert(table, rows) {
  if (rows.length === 0) return `-- (sin filas en ${table.name})`;
  const cols = table.columns.join(",");
  const values = rows
    .map((row) => `(${table.columns.map((col) => toSqlLiteral(row[col])).join(",")})`)
    .join(", ");
  const updates = table.columns
    .filter((col) => !table.pk.includes(col))
    .map((col) => `${col}=excluded.${col}`)
    .join(",");
  return `INSERT INTO public.${table.name} (${cols}) VALUES ${values} ON CONFLICT (${table.pk.join(",")}) DO UPDATE SET ${updates};`;
}

async function main() {
  const sections = [];
  for (const table of TABLES) {
    const { data, error } = await client.from(table.name).select(table.columns.join(",")).order(table.order, { ascending: true });
    if (error) throw new Error(`Error leyendo ${table.name}: ${error.message}`);
    sections.push(`-- ${table.name} (${data.length} filas)\n${buildUpsert(table, data)}`);
  }
  const header = [
    "-- supabase/seed.sql - Contenido esencial del juego (capa de verdad para contribuidores).",
    "-- GENERADO por scripts/supabase/dump-seed.mjs. No incluye cards_catalog (lo gobiernan las",
    "-- migraciones) ni datos de jugador. Se aplica con `pnpm db:reset`.",
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
