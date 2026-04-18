// scripts/release/create-release-tag-from-package-version.mjs - Crea el tag de release leyendo siempre la versión de package.json.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Ejecuta comando shell y devuelve salida limpia.
 */
function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

/**
 * Verifica si existe un tag local con el nombre indicado.
 */
function tagExists(tagName) {
  try {
    run(`git rev-parse -q --verify refs/tags/${tagName}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Falla si hay cambios sin commit para evitar tags inconsistentes.
 */
function ensureCleanTree() {
  const status = run("git status --porcelain");
  if (status.length > 0) {
    throw new Error("Working tree no está limpio. Haz commit/stash antes de crear release tag.");
  }
}

/**
 * Obtiene versión desde package.json y valida SemVer básico.
 */
function readPackageVersion() {
  const packagePath = resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const version = typeof packageJson.version === "string" ? packageJson.version.trim() : "";

  if (!SEMVER_PATTERN.test(version)) {
    throw new Error(`Versión inválida en package.json: "${version}". Usa formato MAJOR.MINOR.PATCH.`);
  }

  return version;
}

function main() {
  const argumentsSet = new Set(process.argv.slice(2));
  const shouldPush = argumentsSet.has("--push");
  const dryRun = argumentsSet.has("--dry-run");

  const version = readPackageVersion();
  const tagName = `v${version}`;

  if (tagExists(tagName)) {
    throw new Error(`El tag ${tagName} ya existe.`);
  }

  if (dryRun) {
    console.log(`[dry-run] Version detectada: ${version}`);
    console.log(`[dry-run] Tag a crear: ${tagName}`);
    console.log(`[dry-run] Comando: git tag -a ${tagName} -m "Release ${tagName}"`);
    if (shouldPush) {
      console.log(`[dry-run] Comando: git push origin ${tagName}`);
    }
    return;
  }

  ensureCleanTree();
  run(`git tag -a ${tagName} -m "Release ${tagName}"`);
  console.log(`Tag creado: ${tagName}`);

  if (shouldPush) {
    run(`git push origin ${tagName}`);
    console.log(`Tag enviado a origin: ${tagName}`);
  } else {
    console.log(`Para publicar el tag ejecuta: git push origin ${tagName}`);
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error(`release:tag failed -> ${message}`);
  process.exit(1);
}
