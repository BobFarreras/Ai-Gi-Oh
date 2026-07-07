// scripts/supabase/validate-card-references.mjs - Valida (sin Docker) que toda carta referenciada por el seed Y por los
// decks de las migraciones (arena/story) exista en una migración de cards_catalog.
// Evita el bug de deriva prod->migraciones: cartas creadas solo en prod (panel admin) que rompen `supabase db reset` con
// FK 23503, y cartas inexistentes en decks de oponentes que "desaparecen" en silencio al hidratarse (arena lee de BD).
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIGRATIONS_DIR = join(ROOT, "docs", "supabase", "sql");
const SEED_FILE = join(ROOT, "supabase", "seed.sql");
const CARD_ID = "(?:entity|exec|trap|fusion|environment)-[a-z0-9-]+";
// Tablas de contenido (sembradas por migraciones, no por el seed) cuyas filas referencian cartas por id.
const DECK_CARD_TABLES = [
  "arena_deck_variant_cards",
  "story_deck_list_cards",
  "story_duel_deck_overrides",
  "story_duel_reward_cards",
  "starter_deck_template_slots",
];

/** Elimina comentarios de línea (`--...`) para que un `;` dentro de un comentario no parta los statements. */
function stripLineComments(sql) {
  return sql.replace(/--[^\n]*/g, "");
}

/** IDs creados: primer token de cada fila dentro de un INSERT a cards_catalog. */
function collectCreatedCardIds() {
  const created = new Set();
  for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql"))) {
    const sql = stripLineComments(readFileSync(join(MIGRATIONS_DIR, file), "utf8")).toLowerCase();
    for (const stmt of sql.split(";")) {
      if (!stmt.includes("cards_catalog") || !stmt.includes("insert")) continue;
      for (const match of stmt.matchAll(new RegExp(`\\(\\s*'(${CARD_ID})'\\s*,`, "g"))) created.add(match[1]);
    }
  }
  return created;
}

/**
 * IDs de entidades de arena (oponentes y variantes de deck) presentes en el seed. Sus `id`
 * pueden empezar por un prefijo de carta (p. ej. `fusion-pressure`) pero NO son cartas: hay
 * que excluirlos para no marcarlos como huérfanos. Mismo criterio que el escáner de migraciones.
 */
function collectSeedArenaEntityIds(sql) {
  const ids = new Set();
  for (const table of ["arena_opponents", "arena_opponent_deck_variants"]) {
    const stmt = sql.match(new RegExp(`insert\\s+into\\s+(?:public\\.)?${table}\\s*\\([^)]*\\)\\s*values([\\s\\S]*?);`));
    if (!stmt) continue;
    for (const row of stmt[1].matchAll(/\(\s*'([^']*)'/g)) ids.add(row[1]);
  }
  return ids;
}

/** IDs referenciados por el seed (tokens entre comillas + elementos de arrays), sin ids de arena. */
function collectSeedReferencedCardIds() {
  const sql = stripLineComments(readFileSync(SEED_FILE, "utf8")).toLowerCase();
  const arenaEntityIds = collectSeedArenaEntityIds(sql);
  const referenced = new Set();
  for (const match of sql.matchAll(new RegExp(`'(${CARD_ID})'`, "g"))) referenced.add(match[1]);
  for (const arr of sql.matchAll(/'\{([^}]*)\}'/g)) {
    for (const token of arr[1].split(",").map((value) => value.trim())) {
      if (new RegExp(`^${CARD_ID}$`).test(token)) referenced.add(token);
    }
  }
  for (const id of arenaEntityIds) referenced.delete(id);
  return referenced;
}

/**
 * IDs de carta referenciados por los decks/contenido de las migraciones (arena/story/starter).
 * En `arena_deck_variant_cards` las cartas viven SOLO dentro de `ARRAY[...]`; el `variant_id` (primer token del row)
 * puede empezar por un prefijo de carta (p. ej. `fusion-pressure`), así que ahí se extrae únicamente del ARRAY para no
 * confundir variantes con cartas. En las tablas story/starter el id de carta es el único token con prefijo de carta.
 */
function collectMigrationDeckReferencedCardIds() {
  const referenced = new Set();
  const targetRegex = new RegExp(`insert\\s+into\\s+(?:public\\.)?(${DECK_CARD_TABLES.join("|")})\\b`);
  const cardTokenRegex = new RegExp(`'(${CARD_ID})'`, "g");
  for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith(".sql"))) {
    const sql = stripLineComments(readFileSync(join(MIGRATIONS_DIR, file), "utf8")).toLowerCase();
    for (const stmt of sql.split(";")) {
      const target = stmt.match(targetRegex);
      if (!target) continue;
      if (target[1] === "arena_deck_variant_cards") {
        for (const arr of stmt.matchAll(/array\[([^\]]*)\]/g)) {
          for (const match of arr[1].matchAll(cardTokenRegex)) referenced.add(match[1]);
        }
      } else {
        for (const match of stmt.matchAll(cardTokenRegex)) referenced.add(match[1]);
      }
    }
  }
  return referenced;
}

const created = collectCreatedCardIds();
const seedReferenced = collectSeedReferencedCardIds();
const deckReferenced = collectMigrationDeckReferencedCardIds();
const seedOrphans = [...seedReferenced].filter((id) => !created.has(id)).sort();
const deckOrphans = [...deckReferenced].filter((id) => !created.has(id)).sort();

if (seedOrphans.length > 0 || deckOrphans.length > 0) {
  if (seedOrphans.length > 0) {
    console.error(`\n✖ Validación FALLIDA: ${seedOrphans.length} carta(s) referenciadas por el seed que NINGUNA migración crea en cards_catalog:`);
    for (const id of seedOrphans) console.error(`   - ${id}`);
    console.error("\nEsto rompería `supabase db reset` con FK 23503. Añade su INSERT en una migración docs/supabase/sql/ (con los valores reales de prod).");
  }
  if (deckOrphans.length > 0) {
    console.error(`\n✖ Validación FALLIDA: ${deckOrphans.length} carta(s) usadas en decks de migraciones (arena/story/starter) que NINGUNA migración crea en cards_catalog:`);
    for (const id of deckOrphans) console.error(`   - ${id}`);
    console.error("\nEstas cartas se omitirían en silencio al hidratar el deck (o romperían al sembrar). Corrige el id o crea la carta en una migración.");
  }
  console.error("");
  process.exit(1);
}

console.log(`✓ Validación de cartas OK: ${seedReferenced.size} referenciadas por el seed y ${deckReferenced.size} en decks de migraciones, todas creadas (${created.size} en cards_catalog).`);
