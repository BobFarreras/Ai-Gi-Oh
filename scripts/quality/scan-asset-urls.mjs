// scripts/quality/scan-asset-urls.mjs - Audita rutas de assets en el SQL canónico y marca formatos no migrados.
//
// Política de formatos del proyecto:
//   - Imágenes  -> .webp   (jpg/jpeg/png/gif/bmp se consideran SIN migrar)
//   - Audio     -> .m4a    (mp3/wav/ogg/aac/flac se consideran SIN migrar)
//   - Vídeo     -> .mp4    (webm/mov/avi se consideran SIN migrar)
//
// Uso:  node scripts/quality/scan-asset-urls.mjs [carpeta]
// Sale con código 1 si encuentra rutas sin migrar (útil como gate manual).
import { readdirSync, readFileSync, statSync } from "node:fs";
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

function main() {
  const root = process.argv[2] || "docs/supabase/sql";
  ui.section(`Escáner de rutas de assets — ${root}`);

  const files = walk(root);
  const findings = []; // { file, url, ext, kind, target }
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const url of content.match(ASSET_URL) ?? []) {
      // Ignora patrones SQL LIKE (p.ej. '/assets/renders/%.png'): un `%` que no sea
      // codificación URL `%XX` indica un comodín, no una ruta real.
      if (/%(?![0-9A-Fa-f]{2})/.test(url)) continue;
      const ext = url.split(".").pop();
      const verdict = classify(ext);
      if (verdict) findings.push({ file, url, ext, ...verdict });
    }
  }

  if (findings.length === 0) {
    ui.ok("Todas las rutas de assets usan el formato correcto (webp/m4a/mp4)");
    return;
  }

  // Resumen por URL única.
  const byUrl = new Map();
  for (const f of findings) {
    const key = f.url;
    const acc = byUrl.get(key) ?? { ...f, count: 0, files: new Set() };
    acc.count += 1;
    acc.files.add(path.relative(root, f.file));
    byUrl.set(key, acc);
  }

  ui.warn(`${findings.length} referencias sin migrar (${byUrl.size} rutas únicas):`);
  ui.print();
  for (const item of [...byUrl.values()].sort((a, b) => b.count - a.count)) {
    const suggested = item.url.replace(/\.[a-zA-Z0-9]+$/, `.${item.target}`);
    ui.print(`  ${paint("yellow", `×${item.count}`)} ${paint("white", item.url)}`);
    ui.print(`        ${paint("gray", `${item.kind} → debería ser`)} ${paint("greenBright", suggested)}`);
    ui.print(`        ${paint("gray", `en: ${[...item.files].join(", ")}`)}`);
  }
  ui.print();
  ui.note(`Total: ${findings.length} referencias en ${files.length} archivos SQL escaneados.`);
  process.exitCode = 1;
}

main();
