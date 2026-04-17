// scripts/supabase/restore-dotenv-local.mjs - Restaura .env.local desde .env.local.backup tras pruebas locales.
import fs from "node:fs";
import path from "node:path";

const repositoryRoot = process.cwd();
const targetPath = path.join(repositoryRoot, ".env.local");
const backupPath = path.join(repositoryRoot, ".env.local.backup");

function main() {
  if (!fs.existsSync(backupPath)) {
    throw new Error("No existe .env.local.backup para restaurar.");
  }
  fs.copyFileSync(backupPath, targetPath);
  fs.unlinkSync(backupPath);
  console.log("OK: .env.local restaurado desde backup.");
}

main();
