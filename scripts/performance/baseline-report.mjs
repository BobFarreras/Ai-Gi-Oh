// scripts/performance/baseline-report.mjs - Genera archivos JSON y Markdown con los resultados de baseline.
import fs from "node:fs/promises";
import path from "node:path";

function metricLabel(value, decimals = 2) {
  if (typeof value !== "number" || value < 0) return "n/a";
  return value.toFixed(decimals);
}

export function buildMarkdownReport(payload) {
  const lines = [];
  lines.push("<!-- docs/performance/results/... - Reporte automático de baseline móvil. -->");
  lines.push("# Reporte Automático de Baseline");
  lines.push("");
  lines.push(`1. Fecha: ${payload.generatedAt}`);
  lines.push(`2. Base URL: ${payload.baseUrl}`);
  lines.push(`3. Device: ${payload.device}`);
  lines.push("");
  for (const result of payload.results) {
    lines.push(`## ${result.profile.toUpperCase()} - ${result.scenario}`);
    lines.push("");
    if (result.error) {
      lines.push(`- Error: ${result.error}`);
    } else {
      lines.push(`- Ruta: ${result.path}`);
      lines.push(`- LCP: ${metricLabel(result.metrics.lcp, 0)} ms`);
      lines.push(`- CLS: ${metricLabel(result.metrics.cls, 3)}`);
      lines.push(`- INP: ${metricLabel(result.metrics.inp, 0)} ms`);
      lines.push(`- Interacciones ejecutadas: ${result.interactionsExecuted ?? 0}`);
      if (Array.isArray(result.interactions) && result.interactions.length > 0) {
        const sorted = [...result.interactions].sort((a, b) => b.durationMs - a.durationMs).slice(0, 3);
        const top = sorted.map((sample) => `${sample.action}:${metricLabel(sample.durationMs, 0)}ms`).join(", ");
        lines.push(`- Telemetría (top): ${top}`);
      }
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export async function writeReports(payload) {
  const outputDir = path.join(process.cwd(), "docs", "performance", "results");
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = payload.generatedAt.replace(/[:.]/g, "-");
  const base = `baseline-mobile-${stamp}`;
  const jsonPath = path.join(outputDir, `${base}.json`);
  const mdPath = path.join(outputDir, `${base}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, buildMarkdownReport(payload), "utf8");
  return { jsonPath, mdPath };
}
