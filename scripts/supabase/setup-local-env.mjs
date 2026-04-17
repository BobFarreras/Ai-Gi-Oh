// scripts/supabase/setup-local-env.mjs - Genera archivo de entorno local de Supabase sin sobrescribir .env.local por defecto.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = process.cwd();
const targetArg = process.argv.find((entry) => entry.startsWith("--target="));
const targetFilename = targetArg ? targetArg.slice("--target=".length).trim() : ".env.local.supabase";
const envPath = path.join(repositoryRoot, targetFilename);

function runSupabaseStatusEnv() {
  const result = spawnSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(
      "No se pudo leer `supabase status -o env`. Asegura Docker activo y ejecuta primero `pnpm supabase:start`.\n" +
        (result.stderr || result.stdout || ""),
    );
  }
  return result.stdout;
}

function parseEnvLines(raw) {
  const entries = new Map();
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes("="))
    .forEach((line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      entries.set(key, value);
    });
  return entries;
}

function parseFileEnv(fileContent) {
  const lines = fileContent.split(/\r?\n/);
  const entries = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    entries.set(key, value);
  }
  return entries;
}

function buildEnvFileContent(existingEntries, overrides) {
  const merged = new Map(existingEntries);
  overrides.forEach((value, key) => merged.set(key, value));
  const orderedKeys = Array.from(merged.keys()).sort((left, right) => left.localeCompare(right));
  const header =
    "# .env.local - Variables locales generadas para ejecutar AI-GI-OH con Supabase local.\n" +
    "# Archivo regenerable con: pnpm supabase:env:local\n";
  const body = orderedKeys.map((key) => `${key}=${merged.get(key) ?? ""}`).join("\n");
  return `${header}\n${body}\n`;
}

function main() {
  const statusEnvOutput = runSupabaseStatusEnv();
  const localSupabase = parseEnvLines(statusEnvOutput);
  const apiUrl = localSupabase.get("API_URL");
  const anonKey = localSupabase.get("ANON_KEY");
  const serviceRoleKey = localSupabase.get("SERVICE_ROLE_KEY");
  if (!apiUrl || !anonKey || !serviceRoleKey) {
    throw new Error("No se pudieron resolver API_URL / ANON_KEY / SERVICE_ROLE_KEY desde Supabase local.");
  }
  const existing = fs.existsSync(envPath) ? parseFileEnv(fs.readFileSync(envPath, "utf8")) : new Map();
  const content = buildEnvFileContent(existing, new Map([
    ["NEXT_PUBLIC_SUPABASE_URL", apiUrl],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey],
    ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
    ["ADMIN_PORTAL_SLUG", existing.get("ADMIN_PORTAL_SLUG") ?? "local-admin"],
  ]));
  fs.writeFileSync(envPath, content, "utf8");
  console.log(`OK: ${targetFilename} sincronizado con Supabase local.`);
}

main();
