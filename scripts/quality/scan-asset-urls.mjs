// scripts/quality/scan-asset-urls.mjs - Audita rutas de assets en el SQL canónico y marca formatos no migrados.
//
// Política de formatos del proyecto:
//   - Imágenes  -> .webp   (jpg/jpeg/png/gif/bmp se consideran SIN migrar)
//   - Audio     -> .m4a    (mp3/wav/ogg/aac/flac se consideran SIN migrar)
//   - Vídeo     -> .mp4    (webm/mov/avi se consideran SIN migrar)
//
// Uso:  node scripts/quality/scan-asset-urls.mjs [carpeta]
// Sale con código 1 si encuentra rutas sin migrar (útil como gate manual).
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { ui, paint } from "../lib/cli-ui.mjs";

const STALE = {
  imagen: { exts: ["jpg", "jpeg", "png", "gif", "bmp"], target: "webp" },
  audio: { exts: ["mp3", "wav", "ogg", "aac", "flac"], target: "m4a" },
  video: { exts: ["webm", "mov", "avi"], target: "mp4" },
};
const ASSET_URL = /\/assets\/[^'"`)\s]+\.[a-zA-Z0-9]+/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    // Las plantillas contienen rutas placeholder (p.ej. sample-card.webp) por diseño.
    if (entry === "templates") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".sql")) out.push(full);
  }
  return out;
}

function classify(ext) {
  const lower = ext.toLowerCase();
  for (const [kind, { exts, target }] of Object.entries(STALE)) {
    if (exts.includes(lower)) return { kind, target };
  }
  return null;
}

function groupByUrl(list, root) {
  const map = new Map();
  for (const f of list) {
    const acc = map.get(f.url) ?? { ...f, count: 0, files: new Set() };
    acc.count += 1;
    acc.files.add(path.relative(root, f.file));
    map.set(f.url, acc);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function main() {
  const root = process.argv[2] || "docs/supabase/sql";
  const publicRoot = process.argv[3] || "public";
  ui.section(`Escáner de rutas de assets — ${root}`);

  const files = walk(root);
  const stale = []; // extensión no migrada
  const missing = []; // archivo inexistente en disco
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const url of content.match(ASSET_URL) ?? []) {
      // Ignora patrones SQL LIKE (p.ej. '/assets/renders/%.png'): un `%` que no sea
      // codificación URL `%XX` indica un comodín, no una ruta real.
      if (/%(?![0-9A-Fa-f]{2})/.test(url)) continue;

      const ext = url.split(".").pop();
      const verdict = classify(ext);
      if (verdict) stale.push({ file, url, ext, ...verdict });

      // Comprobación de existencia: decodifica %XX y resuelve contra /public.
      let decoded;
      try { decoded = decodeURIComponent(url); } catch { decoded = url; }
      if (!existsSync(path.join(publicRoot, decoded))) missing.push({ file, url, decoded });
    }
  }

  if (stale.length === 0 && missing.length === 0) {
    ui.ok("Todas las rutas de assets usan el formato correcto y existen en disco");
    return;
  }

  if (stale.length > 0) {
    ui.warn(`${stale.length} referencias con formato sin migrar (${groupByUrl(stale, root).length} únicas):`);
    ui.print();
    for (const item of groupByUrl(stale, root)) {
      const suggested = item.url.replace(/\.[a-zA-Z0-9]+$/, `.${item.target}`);
      ui.print(`  ${paint("yellow", `×${item.count}`)} ${paint("white", item.url)}`);
      ui.print(`        ${paint("gray", `${item.kind} → debería ser`)} ${paint("greenBright", suggested)}`);
      ui.print(`        ${paint("gray", `en: ${[...item.files].join(", ")}`)}`);
    }
    ui.print();
  }

  if (missing.length > 0) {
    ui.fail(`${missing.length} referencias a archivos que NO existen en ${publicRoot}/ (${groupByUrl(missing, root).length} únicas):`);
    ui.print();
    for (const item of groupByUrl(missing, root)) {
      ui.print(`  ${paint("redBright", `×${item.count}`)} ${paint("white", item.url)}`);
      ui.print(`        ${paint("gray", `esperado en: ${publicRoot}${item.decoded}`)}`);
      ui.print(`        ${paint("gray", `en: ${[...item.files].join(", ")}`)}`);
    }
    ui.print();
  }

  ui.note(`Escaneados ${files.length} archivos SQL · formato: ${stale.length} · inexistentes: ${missing.length}`);
  process.exitCode = 1;
}

main();
