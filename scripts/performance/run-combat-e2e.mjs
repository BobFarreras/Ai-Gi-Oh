// scripts/performance/run-combat-e2e.mjs - Benchmark E2E de combate en móvil con secuencia reproducible y reporte de métricas.
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { maybeStartServer, stopServer } from "./baseline-server.mjs";
import { loadLocalEnv } from "./load-local-env.mjs";

function readArg(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
}

function metricLabel(value, decimals = 0) {
  if (typeof value !== "number" || value < 0) return "n/a";
  return value.toFixed(decimals);
}

async function installObservers(page) {
  await page.addInitScript(() => {
    const state = { lcp: -1, cls: 0, inp: -1, longTasks: 0, longTaskMax: 0 };
    window.__AIGIOH_COMBAT_PERF__ = state;
    try {
      new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) state.lcp = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}
    try {
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) cls += entry.value;
        state.cls = cls;
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (entry.duration > state.inp) state.inp = entry.duration;
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.longTasks += 1;
          if (entry.duration > state.longTaskMax) state.longTaskMax = entry.duration;
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {}
  });
}

async function applyMobileStress(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

async function runStep(page, label, selectors) {
  const startedAt = Date.now();
  for (const selector of selectors) {
    const locator = page.locator(selector);
    if ((await locator.count()) < 1) continue;
    try {
      await locator.first().click({ timeout: 1600 });
      await page.waitForTimeout(450);
      return { label, ok: true, selector, durationMs: Date.now() - startedAt };
    } catch {}
  }
  await page.mouse.click(206, 510);
  await page.waitForTimeout(450);
  return { label, ok: false, selector: "fallback-tap", durationMs: Date.now() - startedAt };
}

function buildCandidatePaths(rawPath) {
  const defaults = ["/hub/training", "/hub/story/chapter/1/duel/1", "/hub/story/chapter/1/duel/0"];
  if (!rawPath) return defaults;
  return [rawPath, ...defaults.filter((item) => item !== rawPath)];
}

async function readPageError(page) {
  const url = page.url();
  if (url.includes("/login")) return "Redirigido a login: se requiere sesión autenticada para medir combate.";
  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("Application error")) return bodyText.slice(0, 260);
  if (bodyText.includes("inválido")) return bodyText.slice(0, 260);
  return null;
}

function buildMarkdown(payload) {
  return [
    "<!-- docs/performance/results/... - Auditoría E2E de combate móvil con secuencia de interacción. -->",
    "# Auditoría E2E de Combate",
    "",
    `1. Fecha: ${payload.generatedAt}`,
    `2. Base URL: ${payload.baseUrl}`,
    `3. Ruta combate: ${payload.combatPath}`,
    "",
    "## Métricas globales",
    "",
    `- LCP: ${metricLabel(payload.metrics.lcp)} ms`,
    `- CLS: ${metricLabel(payload.metrics.cls, 3)}`,
    `- INP: ${metricLabel(payload.metrics.inp)} ms`,
    `- Long Tasks: ${payload.metrics.longTasks}`,
    `- Long Task máx: ${metricLabel(payload.metrics.longTaskMax)} ms`,
    "",
    "## Secuencia ejecutada",
    "",
    ...payload.steps.map((step, idx) => `${idx + 1}. ${step.label} -> ${step.ok ? "ok" : "fallback"} (${step.durationMs} ms) [${step.selector}]`),
    "",
    `## Estado de página`,
    "",
    `- Error detectado: ${payload.pageError ? "sí" : "no"}`,
    ...(payload.pageError ? [`- Mensaje: ${payload.pageError}`] : []),
    "",
  ].join("\n");
}

async function writeReport(payload) {
  const outputDir = path.join(process.cwd(), "docs", "performance", "results");
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = payload.generatedAt.replace(/[:.]/g, "-");
  const base = `combat-e2e-${stamp}`;
  const jsonPath = path.join(outputDir, `${base}.json`);
  const mdPath = path.join(outputDir, `${base}.md`);
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, `${buildMarkdown(payload)}\n`, "utf8");
  return { jsonPath, mdPath };
}

async function main() {
  loadLocalEnv();
  const baseUrl = readArg("baseUrl", process.env.PERF_BASE_URL ?? "http://localhost:3000");
  const combatPath = readArg("combatPath", process.env.PERF_COMBAT_PATH ?? "");
  const storageState = readArg("storageState", "");
  const startServer = readArg("startServer", "");
  const serverProcess = await maybeStartServer(startServer, baseUrl);
  const browser = await chromium.launch({ headless: true });
  try {
    const contextConfig = { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true };
    if (storageState) contextConfig.storageState = storageState;
    const context = await browser.newContext(contextConfig);
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem("debug-performance", "1"));
    await installObservers(page);
    await applyMobileStress(page);
    let selectedPath = "";
    let pageError = null;
    for (const candidatePath of buildCandidatePaths(combatPath)) {
      await page.goto(`${baseUrl}${candidatePath}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(1200);
      const candidateError = await readPageError(page);
      if (!candidateError) {
        selectedPath = candidatePath;
        pageError = null;
        break;
      }
      pageError = candidateError;
    }
    const steps = [];
    if (!pageError) {
      await page.waitForTimeout(1500);
      steps.push(await runStep(page, "Abrir acción de carta", ["button:has-text('Atq')", "button:has-text('Def')", "button:has-text('Activar')"]));
      steps.push(await runStep(page, "Activar ejecución/trampa", ["button:has-text('Activar')", "button:has-text('Combate')"]));
      steps.push(await runStep(page, "Cambiar fase", ["button:has-text('Combate')", "button:has-text('Pasar')", "button:has-text('Battle')"]));
      steps.push(await runStep(page, "Interacción adicional 1", ["button:has-text('Pasar')", "button:has-text('Main')", "button"]));
      steps.push(await runStep(page, "Interacción adicional 2", ["button:has-text('Atq')", "button:has-text('Def')", "button"]));
      await page.waitForTimeout(1500);
    }
    const metrics = await page.evaluate(() => window.__AIGIOH_COMBAT_PERF__ ?? { lcp: -1, cls: -1, inp: -1, longTasks: 0, longTaskMax: 0 });
    const payload = { generatedAt: new Date().toISOString(), baseUrl, combatPath: selectedPath || combatPath || "(sin ruta válida)", metrics, steps, pageError };
    const files = await writeReport(payload);
    console.log("Auditoría E2E de combate completada.");
    console.log(`JSON: ${files.jsonPath}`);
    console.log(`MD: ${files.mdPath}`);
    await context.close();
  } finally {
    await browser.close();
    stopServer(serverProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
