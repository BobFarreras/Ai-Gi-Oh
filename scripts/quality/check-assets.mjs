// scripts/quality/check-assets.mjs - Verifica que los assets referenciados en src/ existan en public/ y no tengan 0 bytes.
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const projectRoot = process.cwd();

const args = process.argv.slice(2);
const srcDirArg = args.find((arg) => arg.startsWith("--src-dir="))?.split("=")[1];
const publicDirArg = args.find((arg) => arg.startsWith("--public-dir="))?.split("=")[1];

const srcDir = srcDirArg ? resolve(projectRoot, srcDirArg) : join(projectRoot, "src");
const publicDir = publicDirArg ? resolve(projectRoot, publicDirArg) : join(projectRoot, "public");

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".m4a",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4",
  ".webm",
]);

const IGNORED_FILE_PATTERNS = [/\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/, /\.md$/];

// Excepciones documentadas para assets rotos preexistentes. Deben resolverse, no aumentarse.
const DOCUMENTED_EXCEPTIONS = new Map([
  ["/audio/story/effects/boss-soundtrack.m4a", "Fichero de 0 bytes pendiente de regenerar."],
  ["/audio/hub/onboarding/soundtrack.m4a", "Fichero de 0 bytes pendiente de regenerar."],
  ["/audio/story/soundtracks/act-1/act-1-main-theme.m4a", "Fichero de 0 bytes pendiente de regenerar."],
  ["/audio/sfx/duel-draw.m4a", "Asset pendiente de diseño sonoro para resultado de empate."],
]);

function shouldIgnoreFile(fileName) {
  return IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

function collectFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, files);
    } else if (entry.isFile() && !shouldIgnoreFile(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractReferencedPaths(content) {
  const paths = new Set();
  // Solo rutas literales con caracteres seguros (sin interpolación, wildcards ni URL-encode).
  const regex = /["'`](\/[a-zA-Z0-9_\-/]+\.[a-zA-Z0-9]+)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const referencedPath = match[1];
    const extension = extname(referencedPath).toLowerCase();
    if (ASSET_EXTENSIONS.has(extension)) {
      paths.add(referencedPath);
    }
  }
  return paths;
}

function runCheck() {
  const srcFiles = collectFiles(srcDir);
  /** @type {Map<string, string[]>} */
  const referencesByPath = new Map();

  for (const file of srcFiles) {
    const content = readFileSync(file, "utf-8");
    for (const referencedPath of extractReferencedPaths(content)) {
      const sources = referencesByPath.get(referencedPath) ?? [];
      sources.push(file);
      referencesByPath.set(referencedPath, sources);
    }
  }

  const errors = [];
  const skipped = [];
  for (const [referencedPath, sources] of referencesByPath) {
    if (DOCUMENTED_EXCEPTIONS.has(referencedPath)) {
      skipped.push({ path: referencedPath, reason: DOCUMENTED_EXCEPTIONS.get(referencedPath), sources });
      continue;
    }
    const absolutePath = join(publicDir, referencedPath);
    try {
      const stats = statSync(absolutePath);
      if (stats.size === 0) {
        errors.push({ kind: "ZERO_BYTES", path: referencedPath, sources });
      }
    } catch {
      errors.push({ kind: "MISSING", path: referencedPath, sources });
    }
  }

  if (skipped.length > 0) {
    console.warn("Asset check skipped documented exceptions:");
    for (const item of skipped) {
      console.warn(`  ${item.path}: ${item.reason}`);
    }
  }

  if (errors.length > 0) {
    console.error("Asset check failed:");
    for (const error of errors) {
      console.error(`  ${error.kind}: ${error.path}`);
      for (const source of error.sources) {
        console.error(`    - ${source}`);
      }
    }
    process.exit(1);
  }

  console.log(`Asset check passed (${referencesByPath.size - skipped.length} assets verified, ${skipped.length} documented exceptions).`);
}

runCheck();
