// scripts/supabase/run-cli.mjs - Reenvía argumentos al CLI de Supabase resuelto (local o global), con error claro si falta.
import { resolveSupabaseCli, getSupabaseInstallHint, runSupabase } from "../lib/supabase-cli.mjs";
import { ui } from "../lib/cli-ui.mjs";

const cli = resolveSupabaseCli();
if (!cli.found) {
  const hint = getSupabaseInstallHint();
  ui.fail("CLI de Supabase no encontrado");
  ui.note(hint.title);
  hint.commands.forEach((command) => ui.command(command));
  ui.note(hint.fallback);
  process.exit(1);
}

const result = runSupabase(cli, process.argv.slice(2));
process.exit(result.status ?? 1);
