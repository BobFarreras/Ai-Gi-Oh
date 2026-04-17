// scripts/supabase/bootstrap-local.mjs - Orquesta bootstrap completo de Supabase local y .env para contribución open source.
import { spawnSync } from "node:child_process";

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

function main() {
  for (const step of steps) runStep(step);
  console.log("\nBootstrap local completado.");
  console.log("Si quieres usar ese entorno en la app actual: `pnpm supabase:env:apply`.");
  console.log("Para volver al .env.local anterior: `pnpm supabase:env:restore`.");
}

main();
