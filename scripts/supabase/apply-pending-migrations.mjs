// scripts/supabase/apply-pending-migrations.mjs - Aplica las migraciones nuevas SIN borrar la BD local.
//
// Diferencia con `pnpm db:reset`, que es lo que casi siempre quieres cuando solo has añadido una migración:
//   db:reset   -> DESTRUYE la base de datos, la recrea, reaplica TODAS las migraciones y vuelve a sembrar
//                 `supabase/seed.sql`. Pierdes tu usuario, tu progreso y cualquier dato de prueba.
//   db:migrate -> aplica solo las migraciones que aún no constan como aplicadas. NO toca tus datos.
//
// Cuándo sigue haciendo falta `db:reset`:
//   - has EDITADO una migración ya aplicada (su versión ya consta, así que no se vuelve a ejecutar);
//   - has insertado un fichero SQL en medio de la numeración (los prefijos posteriores se desplazan);
//   - quieres volver al contenido exacto del seed del repo.
import { spawnSync } from "node:child_process";
import { ui } from "../lib/cli-ui.mjs";

function runNode(title, args) {
  ui.step(title);
  const result = spawnSync("node", args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    ui.fail(`Fallo en: ${title}`);
    process.exit(result.status ?? 1);
  }
}

ui.section("Aplicar migraciones pendientes (sin borrar datos)");
// 1) Regenerar supabase/migrations desde docs/supabase/sql (fuente de verdad del repo).
runNode("Regenerando migraciones desde docs/supabase/sql", ["scripts/supabase/prepare-local-migrations.mjs"]);
// 2) Validar referencias de cartas antes de tocar la BD (falla rápido y sin Docker).
runNode("Validando referencias de cartas (seed ↔ migraciones)", ["scripts/supabase/validate-card-references.mjs"]);
// 3) `--include-all` es obligatorio aquí: las migraciones generadas llevan prefijo 2026-01-01 y quedan
//    ANTES de las escritas a mano con fecha real, así que sin el flag el CLI las consideraría fuera de orden.
runNode("Aplicando migraciones pendientes", ["scripts/supabase/run-cli.mjs", "migration", "up", "--local", "--include-all"]);
ui.ok("Migraciones al día. Tus datos locales siguen intactos.");
