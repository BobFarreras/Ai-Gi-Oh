// scripts/supabase/reset-local.mjs - Re-sincroniza la BD local: regenera migraciones desde docs/ y resetea.
//
// Para contribuidores: tras `git pull`, ejecuta `pnpm db:reset` para que tu Docker quede
// idéntico al repo (estructura + contenido del seed). BORRA los datos locales (en local solo
// hay pruebas; los datos de jugador nunca se siembran).
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

ui.section("Re-sincronizar BD local");
// 1) Regenerar supabase/migrations desde docs/supabase/sql (fuente de verdad).
runNode("Regenerando migraciones desde docs/supabase/sql", ["scripts/supabase/prepare-local-migrations.mjs"]);
// 2) Reset: reaplica migraciones + supabase/seed.sql sobre una BD limpia.
runNode("Reseteando BD local (migraciones + seed)", ["scripts/supabase/run-cli.mjs", "db", "reset", "--local"]);
ui.ok("BD local sincronizada con el repo");
