// scripts/supabase/apply-local-env-to-dotenv-local.mjs - Aplica .env.local.supabase sobre .env.local con backup automático.
import fs from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const sourcePath = path.join(repositoryRoot, ".env.local.supabase");
const targetPath = path.join(repositoryRoot, ".env.local");
const backupPath = path.join(repositoryRoot, ".env.local.backup");

function parseEnvFile(content) {
  const entries = new Map();
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && line.includes("="))
    .forEach((line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      entries.set(key, value);
    });
  return entries;
}

function serializeEnv(entries) {
  const keys = Array.from(entries.keys()).sort((left, right) => left.localeCompare(right));
  const header =
    "# .env.local - Entorno activo local.\n" +
    "# Para restaurar el previo: pnpm supabase:env:restore\n";
  const body = keys.map((key) => `${key}=${entries.get(key) ?? ""}`).join("\n");
  return `${header}\n${body}\n`;
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error("Falta .env.local.supabase. Ejecuta antes `pnpm supabase:env:local`.");
  }
  const sourceEntries = parseEnvFile(fs.readFileSync(sourcePath, "utf8"));
  const existingEntries = fs.existsSync(targetPath) ? parseEnvFile(fs.readFileSync(targetPath, "utf8")) : new Map();
  if (fs.existsSync(targetPath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(targetPath, backupPath);
  }
  const merged = new Map(existingEntries);
  sourceEntries.forEach((value, key) => merged.set(key, value));
  fs.writeFileSync(targetPath, serializeEnv(merged), "utf8");
  console.log("OK: .env.local activado con valores de Supabase local (backup en .env.local.backup).");
}

main();
