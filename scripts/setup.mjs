// scripts/setup.mjs - Asistente interactivo de setup para contribuidores.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function run(command, args = [], opts = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  return result.status === 0;
}

function header(msg) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${msg}`);
  console.log("=".repeat(50));
}

async function checkPrereqs() {
  header("Verificando prerrequisitos");

  const checks = [
    { name: "Node.js 20+", ok: (() => {
      const v = process.version;
      const major = parseInt(v.slice(1).split(".")[0], 10);
      return major >= 20;
    })() },
    { name: "pnpm", ok: run("pnpm", ["--version"]) },
    { name: "Docker Desktop", ok: run("docker", ["info", "--format", "{{.ServerVersion}}"]) },
  ];

  for (const c of checks) {
    console.log(`  ${c.ok ? "✅" : "❌"} ${c.name}`);
  }

  if (checks.some((c) => !c.ok)) {
    console.log("\nFaltan prerrequisitos. Instálalos antes de continuar.");
    console.log("  - Node.js 20+: https://nodejs.org");
    console.log("  - pnpm: https://pnpm.io/installation");
    console.log("  - Docker Desktop: https://www.docker.com/products/docker-desktop");
    return false;
  }
  return true;
}

async function main() {
  header("AI-GI-OH — Setup de contribuidor");

  if (!(await checkPrereqs())) {
    process.exit(1);
  }

  // ── Paso 1: pnpm install ──
  console.log("\n📦 Instalando dependencias...");
  if (!run("pnpm", ["install"])) {
    console.error("❌ Error en pnpm install. Revisa la salida.");
    process.exit(1);
  }

  // ── Paso 2: Aprobar builds de paquetes nativos ──
  header("Aprobar builds de paquetes nativos");
  console.log("pnpm v10+ bloquea scripts de instalación por defecto.");
  console.log("Esto es necesario para que supabase CLI se descargue correctamente.\n");
  console.log("Se abrirá un selector interactivo. Selecciona:");
  console.log("  - @playwright/test (si vas a usar tests e2e)");
  console.log("  - supabase (necesario para Supabase local)");
  console.log("  - @swc/* si aparecen (necesario para build)\n");

  const approveAnswer = await ask("¿Quieres ejecutar 'pnpm approve-builds' ahora? (S/n): ");
  if (approveAnswer.toLowerCase() !== "n") {
    if (!run("pnpm", ["approve-builds"])) {
      console.log("⚠️  approve-builds falló o fue cancelado. Puedes ejecutarlo manualmente después.");
      console.log("    pnpm approve-builds");
    }
    // Re-run install to apply approved builds
    console.log("\n🔄 Re-ejecutando pnpm install para aplicar builds aprobados...");
    run("pnpm", ["install"]);
  }

  // ── Paso 3: Bootstrap Supabase ──
  header("Supabase local");
  console.log("Esto levantará contenedores Docker y creará la DB local.");
  console.log("Asegúrate de que Docker Desktop está corriendo.\n");

  const bootstrapAnswer = await ask("¿Quieres ejecutar el bootstrap de Supabase? (S/n): ");
  if (bootstrapAnswer.toLowerCase() !== "n") {
    if (!run("node", ["scripts/supabase/bootstrap-local.mjs"])) {
      console.error("\n❌ Bootstrap de Supabase falló.");
      console.log("Posibles causas:");
      console.log("  - Docker Desktop no está corriendo");
      console.log("  - Puerto 54323 ya en uso");
      console.log("  - Fallo en descarga del CLI de Supabase (sin internet)");
      console.log("\nPuedes reintentar manualmente: pnpm supabase:bootstrap:local");
    }
  }

  // ── Paso 4: Aplicar .env ──
  if (existsSync(".env.local.supabase")) {
    header("Aplicar variables de entorno");
    const envAnswer = await ask("¿Quieres aplicar .env.local.supabase sobre .env.local? (S/n): ");
    if (envAnswer.toLowerCase() !== "n") {
      if (!run("node", ["scripts/supabase/apply-local-env-to-dotenv-local.mjs"])) {
        console.log("⚠️  Error al aplicar .env. Puedes hacerlo manualmente: pnpm supabase:env:apply");
      }
    }
  } else {
    console.log("\n⚠️  No se encontró .env.local.supabase. El bootstrap puede haber fallado.");
    console.log("Ejecuta manualmente: pnpm supabase:bootstrap:local && pnpm supabase:env:apply");
  }

  // ── Resumen ──
  header("Setup completado");
  console.log("Comandos útiles:");
  console.log("  pnpm dev                    Arrancar la app");
  console.log("  pnpm lint                   Linting");
  console.log("  pnpm typecheck              Type checking");
  console.log("  pnpm test                   Tests unitarios");
  console.log("  pnpm build                  Build de producción");
  console.log("  pnpm supabase:stop          Parar contenedores Supabase");
  console.log("\nURLs:");
  console.log("  App:          http://localhost:3000");
  console.log("  Supabase:     http://127.0.0.1:54323");
  console.log("  Inbucket:     http://127.0.0.1:54324");

  rl.close();
}

main();
