// scripts/release/sync-version.mjs - Sube la versión en package.json, README y CHANGELOG a la vez (un único punto de verdad).
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEMVER = /^\d+\.\d+\.\d+$/;
const ROOT = process.cwd();
const PATHS = {
  pkg: resolve(ROOT, "package.json"),
  readme: resolve(ROOT, "README.md"),
  changelog: resolve(ROOT, "CHANGELOG.md"),
};

function fail(message) {
  console.error(`release:prepare -> ${message}`);
  process.exit(1);
}

/** Calcula la próxima versión desde un bump (major/minor/patch) o una versión explícita. */
function resolveNextVersion(current, request) {
  if (SEMVER.test(request)) return request;
  const [major, minor, patch] = current.split(".").map(Number);
  if (request === "major") return `${major + 1}.0.0`;
  if (request === "minor") return `${major}.${minor + 1}.0`;
  if (request === "patch") return `${major}.${minor}.${patch + 1}`;
  return null;
}

/** Reemplaza el campo "version" de nivel superior en package.json conservando el formato. */
function buildPackageJson(prev, next) {
  const raw = readFileSync(PATHS.pkg, "utf8");
  const updated = raw.replace(/("version":\s*")\d+\.\d+\.\d+(")/, `$1${next}$2`);
  if (updated === raw) fail("No se pudo actualizar la versión en package.json.");
  return [PATHS.pkg, updated];
}

/** Actualiza las 3 menciones de versión del README (comentario, subtítulo, badge de shields). */
function buildReadme(prev, next) {
  const raw = readFileSync(PATHS.readme, "utf8");
  const updated = raw.replaceAll(`v${prev}`, `v${next}`).replaceAll(`version-${prev}-`, `version-${next}-`);
  if (updated === raw) fail(`README.md no menciona v${prev}; revisa su formato antes de subir versión.`);
  return [PATHS.readme, updated];
}

/** Promueve la sección [Unreleased] a la nueva versión y añade los enlaces de comparación del pie. */
function buildChangelog(prev, next, allowEmpty) {
  const raw = readFileSync(PATHS.changelog, "utf8");
  const nl = raw.includes("\r\n") ? "\r\n" : "\n"; // respeta el fin de línea del archivo (CRLF en Windows).
  const section = raw.match(/## \[Unreleased\]\s*\r?\n([\s\S]*?)(?=\r?\n## \[)/);
  if (!section) fail("No se encontró la sección '## [Unreleased]' en CHANGELOG.md.");
  if (!section[1].trim() && !allowEmpty) {
    fail("'## [Unreleased]' está vacío. Añade los cambios bajo esa sección (o usa --allow-empty).");
  }
  const base = raw.match(/\[Unreleased\]:\s*(https:\/\/\S+?)\/compare\/v[\d.]+\.\.\.HEAD/)?.[1];
  if (!base) fail("No se encontró el enlace '[Unreleased]: .../compare/vX...HEAD' en el pie del CHANGELOG.");
  const date = new Date().toISOString().slice(0, 10);
  const updated = raw
    .replace(/## \[Unreleased\]\r?\n/, `## [Unreleased]${nl}${nl}## [${next}] - ${date}${nl}`)
    .replace(
      /\[Unreleased\]:\s*\S+/,
      `[Unreleased]: ${base}/compare/v${next}...HEAD${nl}[${next}]: ${base}/compare/v${prev}...v${next}`,
    );
  return [PATHS.changelog, updated];
}

function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const request = args.find((arg) => !arg.startsWith("--"));
  if (!request) {
    fail("Uso: pnpm release:prepare <major|minor|patch|X.Y.Z> [--dry-run] [--allow-empty]");
  }

  const current = JSON.parse(readFileSync(PATHS.pkg, "utf8")).version;
  if (!SEMVER.test(current)) fail(`Versión actual inválida en package.json: "${current}".`);
  const next = resolveNextVersion(current, request);
  if (!next || !SEMVER.test(next)) fail(`Petición de versión inválida: "${request}".`);
  if (next === current) fail(`La versión ${next} es igual a la actual.`);

  const edits = [
    buildPackageJson(current, next),
    buildReadme(current, next),
    buildChangelog(current, next, flags.has("--allow-empty")),
  ];

  if (flags.has("--dry-run")) {
    console.log(`[dry-run] ${current} -> ${next}`);
    console.log(`[dry-run] Se actualizarían: package.json, README.md, CHANGELOG.md`);
    return;
  }

  for (const [path, content] of edits) writeFileSync(path, content);
  console.log(`Versión sincronizada: ${current} -> ${next}`);
  console.log("Archivos: package.json, README.md, CHANGELOG.md");
  console.log("Revisa el diff, commitea, y publica con: pnpm release:tag:push");
}

main();
