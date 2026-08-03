// scripts/setup.mjs - Asistente interactivo de setup para contribuidores de AI-GI-OH.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { ui, paint } from "./lib/cli-ui.mjs";
import { resolveSupabaseCli, getSupabaseInstallHint, getSupabaseDownloadInfo, managedBinDir } from "./lib/supabase-cli.mjs";

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`  ${paint("cyan", "?")} ${question} `, (answer) => resolve(answer.trim()));
  });
}

async function confirm(question, defaultYes = true) {
  const hint = defaultYes ? "(S/n)" : "(s/N)";
  const answer = (await ask(`${question} ${paint("gray", hint)}`)).toLowerCase();
  if (answer === "") return defaultYes;
  return answer === "s" || answer === "y" || answer === "si" || answer === "yes";
}

function run(command, args = [], opts = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  return result.status === 0;
}

function commandWorks(command, args) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: process.platform === "win32" });
  return result.status === 0;
}

function nodeMajorVersion() {
  return parseInt(process.version.slice(1).split(".")[0], 10);
}

function checkPrereqs() {
  ui.section("Verificando prerrequisitos");
  const checks = [
    { name: "Node.js 20+", detail: process.version, ok: nodeMajorVersion() >= 20 },
    { name: "pnpm", detail: "gestor de paquetes", ok: commandWorks("pnpm", ["--version"]) },
    { name: "Docker Desktop (corriendo)", detail: "necesario para Supabase local", ok: commandWorks("docker", ["info", "--format", "{{.ServerVersion}}"]) },
  ];

  for (const check of checks) {
    if (check.ok) ui.ok(check.name, check.detail);
    else ui.fail(check.name, check.detail);
  }

  if (checks.every((check) => check.ok)) return true;

  ui.print();
  ui.warn("Faltan prerrequisitos. Instálalos antes de continuar:");
  ui.note("Node.js 20+ → https://nodejs.org");
  ui.note("pnpm → https://pnpm.io/installation");
  ui.note("Docker Desktop → https://www.docker.com/products/docker-desktop");
  if (!checks[2].ok) ui.note("Si tienes Docker instalado: ábrelo y espera a que el icono deje de cargar.");
  return false;
}

function detectPackageManager() {
  // ¿Hay scoop (Windows) o brew (mac/linux) para instalar supabase automáticamente?
  if (process.platform === "win32") {
    if (commandWorks("scoop", ["--version"])) {
      return {
        name: "scoop",
        commands: [
          ["scoop", ["bucket", "add", "supabase", "https://github.com/supabase/scoop-bucket.git"]],
          ["scoop", ["install", "supabase"]],
        ],
      };
    }
    return null;
  }
  if (commandWorks("brew", ["--version"])) {
    return { name: "brew", commands: [["brew", ["install", "supabase/tap/supabase"]]] };
  }
  return null;
}

function downloadSupabaseCli() {
  // Descarga el binario standalone desde GitHub releases a <repo>/.bin, sin instalar nada en el
  // sistema. Usa curl y tar, presentes de serie en Windows 10+/macOS/Linux. Todos los SO usan .tar.gz.
  const info = getSupabaseDownloadInfo();
  const dir = managedBinDir();
  mkdirSync(dir, { recursive: true });
  const archivePath = path.join(dir, info.archiveName);

  ui.step("Descargando CLI de Supabase", `v${info.version}`);
  // En Windows, schannel suele fallar la comprobación de revocación del certificado
  // (CRYPT_E_NO_REVOCATION_CHECK); --ssl-no-revoke la omite. En otros SO es inocuo.
  const curlArgs = ["-fSL", "--retry", "3", "-o", archivePath, info.url];
  if (process.platform === "win32") curlArgs.unshift("--ssl-no-revoke");
  if (!run("curl", curlArgs)) {
    ui.warn("No se pudo descargar el archivo (¿sin conexión o proxy/cert?).");
    return false;
  }
  ui.step("Extrayendo binario");
  if (!run("tar", ["-xzf", archivePath, "-C", dir])) {
    ui.warn("No se pudo extraer el archivo descargado.");
    return false;
  }
  try { rmSync(archivePath, { force: true }); } catch { /* no pasa nada */ }
  return existsSync(path.join(dir, info.binaryName));
}

async function checkSupabaseCli() {
  ui.section("CLI de Supabase");
  let cli = resolveSupabaseCli();
  if (cli.found) {
    const where = cli.source === "local" ? "en node_modules"
      : cli.source === "managed" ? "descargado en .bin"
      : "instalado en el sistema";
    ui.ok("CLI de Supabase detectado", where);
    return true;
  }

  ui.warn("CLI de Supabase no encontrado");

  // Opción universal (no instala nada en el sistema): descargar el binario a <repo>/.bin.
  if (await confirm("¿Descargar el CLI de Supabase automáticamente? (no instala nada en el sistema)")) {
    if (downloadSupabaseCli()) {
      cli = resolveSupabaseCli();
      if (cli.found) {
        ui.ok("CLI de Supabase descargado en .bin");
        return true;
      }
    }
    ui.warn("La descarga automática no completó.");
  }

  // Alternativa: instalación con gestor de paquetes si está disponible.
  const pm = detectPackageManager();
  if (pm && (await confirm(`¿Instalar el CLI de Supabase con ${pm.name} en su lugar?`))) {
    for (const [command, args] of pm.commands) run(command, args);
    cli = resolveSupabaseCli();
    if (cli.found) {
      ui.ok("CLI de Supabase instalado correctamente");
      return true;
    }
  }

  ui.print();
  const hint = getSupabaseInstallHint();
  ui.note(hint.title);
  hint.commands.forEach((command) => ui.command(command));
  ui.note(hint.fallback);
  ui.print();
  ui.note("Cuando lo tengas instalado, vuelve a ejecutar: node scripts/setup.mjs");
  return false;
}

async function main() {
  ui.banner();
  ui.print(paint("gray", "  Este asistente prepara tu entorno local paso a paso. Puedes cancelar con Ctrl+C.\n"));

  if (!checkPrereqs()) {
    rl.close();
    process.exit(1);
  }

  // ── Instalar dependencias ──
  ui.section("Instalar dependencias");
  ui.note("Tras instalar, se compilan los binarios nativos (esbuild, sharp, unrs-resolver).");
  if (await confirm("¿Ejecutar 'pnpm install' ahora?")) {
    // pnpm install puede salir con ERR_PNPM_IGNORED_BUILDS según la versión de pnpm (no
    // siempre respeta el allowlist de .npmrc). Aun así, los paquetes quedan instalados.
    const installOk = run("pnpm", ["install"]);

    // Red de seguridad universal: `pnpm rebuild` compila los scripts nativos SIN el gate de
    // aprobación, funcione como funcione el install. Es idempotente y no depende de la versión.
    ui.step("Compilando binarios nativos", "esbuild, sharp, unrs-resolver");
    const buildsOk = run("pnpm", ["rebuild", "esbuild", "sharp", "unrs-resolver"]);

    if (!buildsOk) {
      ui.fail("No se pudieron compilar los binarios nativos.");
      if (!installOk) ui.note("El 'pnpm install' también falló: revisa tu conexión y reintenta.");
      else ui.note("Reintenta manualmente: pnpm rebuild esbuild sharp unrs-resolver");
      rl.close();
      process.exit(1);
    }
    ui.ok("Dependencias instaladas y binarios compilados");
  }

  // ── CLI de Supabase ──
  if (!(await checkSupabaseCli())) {
    rl.close();
    process.exit(1);
  }

  // ── Bootstrap Supabase ──
  ui.section("Levantar Supabase local");
  ui.note("Esto levanta los contenedores Docker, aplica el esquema y genera .env.local.supabase.");
  if (await confirm("¿Ejecutar el bootstrap de Supabase ahora?")) {
    if (!run("node", ["scripts/supabase/bootstrap-local.mjs"])) {
      ui.fail("El bootstrap de Supabase falló (ver detalle arriba).");
      ui.note("Puedes reintentarlo con: pnpm supabase:bootstrap:local");
      rl.close();
      process.exit(1);
    }
  }

  // ── Aplicar .env ──
  if (existsSync(".env.local.supabase")) {
    ui.section("Variables de entorno");
    if (await confirm("¿Aplicar .env.local.supabase sobre .env.local? (se guarda backup)")) {
      if (!run("node", ["scripts/supabase/apply-local-env-to-dotenv-local.mjs"])) {
        ui.warn("No se pudo aplicar el .env. Hazlo manualmente: pnpm supabase:env:apply");
      } else {
        ui.ok(".env.local actualizado");
      }
    }
  }

  // ── Resumen ──
  ui.section("Setup completado");
  ui.print(`  ${paint("greenBright", "¡Listo!")} Tu entorno AI-GI-OH está preparado.\n`);
  ui.note("Comandos útiles:");
  ui.command("pnpm dev                 Arrancar la app");
  ui.command("pnpm test                Tests unitarios");
  ui.command("pnpm supabase:stop       Parar Supabase local");
  ui.print();
  ui.note("URLs locales:");
  ui.note("App            → http://localhost:3000");
  ui.note("Supabase Studio → http://127.0.0.1:57323  (UI para inspeccionar la BD)");
  ui.note("Inbucket (mail) → http://127.0.0.1:57324");
  ui.print();

  rl.close();
}

main().catch((error) => {
  ui.fail(error?.message ?? "Error inesperado en el setup");
  rl.close();
  process.exit(1);
});
