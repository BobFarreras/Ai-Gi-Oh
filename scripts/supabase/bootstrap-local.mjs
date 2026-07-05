// scripts/supabase/bootstrap-local.mjs - Orquesta el bootstrap de Supabase local para contribución open source.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { ui, paint } from "../lib/cli-ui.mjs";
import { resolveSupabaseCli, getSupabaseInstallHint, runSupabase } from "../lib/supabase-cli.mjs";

function checkDocker() {
  const result = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function runNodeStep(title, scriptPath) {
  ui.step(title);
  const result = spawnSync("node", [scriptPath], { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`Fallo en paso: ${title}`);
}

function printInstallHint() {
  const hint = getSupabaseInstallHint();
  ui.fail("CLI de Supabase no encontrado");
  ui.print();
  ui.note(hint.title);
  hint.commands.forEach((command) => ui.command(command));
  ui.note(hint.fallback);
  ui.print();
}

function main() {
  ui.section("Bootstrap Supabase local");

  if (!checkDocker()) {
    ui.fail("Docker Desktop no está corriendo");
    ui.note("Inicia Docker Desktop, espera a que arranque y vuelve a ejecutar este comando.");
    process.exit(1);
  }
  ui.ok("Docker Desktop activo");

  if (!existsSync("node_modules/.pnpm")) {
    ui.fail("Dependencias no instaladas");
    ui.note("Ejecuta primero: pnpm install");
    process.exit(1);
  }

  const cli = resolveSupabaseCli();
  if (!cli.found) {
    printInstallHint();
    process.exit(1);
  }
  ui.ok("CLI de Supabase detectado", cli.source === "global" ? "PATH global" : "node_modules");

  // 1) Generar migraciones locales a partir del SQL canónico.
  runNodeStep("Generando migraciones locales", "scripts/supabase/prepare-local-migrations.mjs");

  // 2) Levantar contenedores. `supabase start` ya aplica migraciones y seed en el primer arranque,
  //    por eso no hace falta un `db reset` posterior. Usamos --ignore-health-check porque en Windows
  //    el polling de salud del CLI da falsos negativos (el contenedor arranca, pero el check expira);
  //    el paso siguiente reintenta `supabase status` hasta que los servicios respondan de verdad.
  ui.step("Levantando contenedores Supabase", "puede tardar varios minutos la primera vez");
  const startResult = runSupabase(cli, ["start", "--ignore-health-check"]);
  if (startResult.status !== 0) {
    ui.fail("No se pudieron levantar los contenedores de Supabase");
    ui.note("Causas típicas (en orden de frecuencia):");
    ui.note("  1) DNS/red de Docker: si ves 'no such host' o 'unexpected EOF' al descargar imágenes,");
    ui.note("     Docker no tiene salida a internet. Reinicia Docker Desktop por completo (icono de la");
    ui.note("     bandeja → Quit → abrir de nuevo) y pausa VPN/proxy/antivirus si los usas.");
    ui.note("  2) Puertos 54321-54324 ocupados por otro proceso.");
    ui.note("  3) Docker con pocos recursos (RAM/disco) asignados.");
    ui.note("Cuando Docker vuelva a tener red, reintenta SOLO este paso: pnpm supabase:bootstrap:local");
    process.exit(1);
  }

  // 3) Generar el .env con las claves locales.
  runNodeStep("Generando .env.local.supabase", "scripts/supabase/setup-local-env.mjs");

  ui.print();
  ui.ok(paint("greenBright", "Bootstrap local completado"));
  ui.note("Siguiente paso: pnpm supabase:env:apply");
  ui.note("Para volver al .env.local anterior: pnpm supabase:env:restore");
}

main();
