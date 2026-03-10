// scripts/performance/load-local-env.mjs - Carga variables desde .env.local/.env para scripts Node sin depender de shell exports.
import fs from "node:fs";
import path from "node:path";

function parseEnvContent(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }
  return result;
}

export function loadLocalEnv() {
  const cwd = process.cwd();
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    const fullPath = path.join(cwd, file);
    if (!fs.existsSync(fullPath)) continue;
    const values = parseEnvContent(fs.readFileSync(fullPath, "utf8"));
    for (const [key, value] of Object.entries(values)) {
      if (!process.env[key]) process.env[key] = value;
    }
  }
}
