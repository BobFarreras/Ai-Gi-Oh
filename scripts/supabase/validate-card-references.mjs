// scripts/supabase/validate-card-references.mjs - Valida (sin Docker) que toda carta referenciada por el seed exista en una migración de cards_catalog.
// Evita el bug de deriva prod->migraciones: cartas creadas solo en prod (panel admin) que rompen `supabase db reset` con FK 23503.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIGRATIONS_DIR = join(ROOT, "docs", "supabase", "sql");
const SEED_FILE = join(ROOT, "supabase", "seed.sql");
const CARD_ID = "(?:entity|exec|trap|fusion|environment)-[a-z0-9-]+";

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

/** IDs referenciados por el seed (tokens entre comillas + elementos de arrays preview_card_ids). */
function collectSeedReferencedCardIds() {
  const sql = stripLineComments(readFileSync(SEED_FILE, "utf8")).toLowerCase();
  const referenced = new Set();
  for (const match of sql.matchAll(new RegExp(`'(${CARD_ID})'`, "g"))) referenced.add(match[1]);
  for (const arr of sql.matchAll(/'\{([^}]*)\}'/g)) {
    for (const token of arr[1].split(",").map((value) => value.trim())) {
      if (new RegExp(`^${CARD_ID}$`).test(token)) referenced.add(token);
    }
  }
  return referenced;
}

const created = collectCreatedCardIds();
const referenced = collectSeedReferencedCardIds();
const orphans = [...referenced].filter((id) => !created.has(id)).sort();

if (orphans.length > 0) {
  console.error(`\n✖ Validación de cartas FALLIDA: ${orphans.length} carta(s) referenciadas por el seed que NINGUNA migración crea en cards_catalog:`);
  for (const id of orphans) console.error(`   - ${id}`);
  console.error("\nEsto rompería `supabase db reset` con FK 23503. Añade su INSERT en una migración docs/supabase/sql/ (con los valores reales de prod).\n");
  process.exit(1);
}

console.log(`✓ Validación de cartas OK: ${referenced.size} cartas referenciadas por el seed, todas creadas por migraciones (${created.size} en cards_catalog).`);
