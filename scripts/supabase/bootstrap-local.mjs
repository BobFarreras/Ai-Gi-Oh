// scripts/supabase/bootstrap-local.mjs - Orquesta bootstrap completo de Supabase local y .env para contribución open source.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const steps = [
  {
    title: "Generando migraciones locales",
    command: ["node", "scripts/supabase/prepare-local-migrations.mjs"],
  },
  {
    title: "Levantando contenedores Supabase",
    command: ["pnpm", "exec", "supabase", "start"],
  },
  {
    title: "Aplicando esquema local (db reset)",
    command: ["pnpm", "exec", "supabase", "db", "reset", "--local"],
  },
  {
    title: "Generando .env.local.supabase",
    command: ["node", "scripts/supabase/setup-local-env.mjs"],
  },
];

function runStep(step) {
  console.log(`\n==> ${step.title}`);
  const [command, ...args] = step.command;
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`Fallo en paso: ${step.title}`);
  }
}

function checkDocker() {
  const result = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function main() {
  if (!checkDocker()) {
    console.error("\n❌ Docker Desktop no está corriendo.");
    console.error("Inicia Docker Desktop y vuelve a ejecutar este comando.");
    process.exit(1);
  }

  if (!existsSync("node_modules/.pnpm")) {
    console.log("\n⚠️  node_modules no encontrado o incompleto.");
    console.log("Ejecuta primero: pnpm install && pnpm approve-builds");
    process.exit(1);
  }

  for (const step of steps) runStep(step);

  console.log("\n✅ Bootstrap local completado.");
  console.log("Siguiente paso: pnpm supabase:env:apply");
  console.log("Para volver al .env.local anterior: pnpm supabase:env:restore");
}

main();
