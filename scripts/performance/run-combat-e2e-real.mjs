// scripts/performance/run-combat-e2e-real.mjs - Auditoría E2E real de combate con login de usuario y navegación a duelo Story desde BD.
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { maybeStartServer, stopServer } from "./baseline-server.mjs";
import { loadLocalEnv } from "./load-local-env.mjs";

function readArg(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
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

async function runStep(page, label, selectors) {
  const startedAt = Date.now();
  for (const selector of selectors) {
    const locator = page.locator(selector);
    if ((await locator.count()) < 1) continue;
    try {
      await locator.first().click({ timeout: 1800 });
      await page.waitForTimeout(500);
      return { label, ok: true, selector, durationMs: Date.now() - startedAt };
    } catch {}
  }
  await page.mouse.click(206, 510);
  await page.waitForTimeout(500);
  return { label, ok: false, selector: "fallback-tap", durationMs: Date.now() - startedAt };
}

async function applyMobileProfile(page, profile) {
  if (profile !== "stress") return;
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

async function writeReport(payload) {
  const outputDir = path.join(process.cwd(), "docs", "performance", "results");
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = payload.generatedAt.replace(/[:.]/g, "-");
  const base = `combat-e2e-real-${stamp}`;
  const jsonPath = path.join(outputDir, `${base}.json`);
  const mdPath = path.join(outputDir, `${base}.md`);
  const lines = [
    "<!-- docs/performance/results/... - Auditoría E2E real de combate con usuario autenticado y duelo Story desde BD. -->",
    "# Auditoría E2E Real de Combate",
    "",
    `1. Fecha: ${payload.generatedAt}`,
    `2. Base URL: ${payload.baseUrl}`,
    `3. Perfil: ${payload.profile}`,
    `4. Usuario: ${payload.email}`,
    `5. URL duelo: ${payload.duelUrl ?? "n/a"}`,
    "",
    "## Métricas globales",
    "",
    `- LCP: ${payload.metrics.lcp}`,
    `- CLS: ${payload.metrics.cls}`,
    `- INP: ${payload.metrics.inp}`,
    `- Long Tasks: ${payload.metrics.longTasks}`,
    `- Long Task máx: ${payload.metrics.longTaskMax}`,
    "",
    "## Secuencia ejecutada",
    "",
    ...payload.steps.map((step, idx) => `${idx + 1}. ${step.label} -> ${step.ok ? "ok" : "fallback"} (${step.durationMs} ms)`),
    "",
    "## Estado",
    "",
    `- Error: ${payload.error ?? "ninguno"}`,
  ];
  await fs.writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await fs.writeFile(mdPath, `${lines.join("\n")}\n`, "utf8");
  return { jsonPath, mdPath };
}

async function main() {
  loadLocalEnv();
  const baseUrl = readArg("baseUrl", process.env.PERF_BASE_URL ?? "http://localhost:3000");
  const startServer = readArg("startServer", "");
  const profile = readArg("profile", process.env.PERF_PROFILE ?? "realistic");
  const email = readArg("email", process.env.PERF_EMAIL ?? "");
  const password = readArg("password", process.env.PERF_PASSWORD ?? "");
  if (!email || !password) throw new Error("Faltan credenciales. Usa --email=... --password=...");

  const serverProcess = await maybeStartServer(startServer, baseUrl);
  const browser = await chromium.launch({ headless: true });
  let duelUrl = null;
  const steps = [];
  let error = null;
  try {
    const context = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await installObservers(page);
    await applyMobileProfile(page, profile);
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.getByLabel("Email de acceso").fill(email);
    await page.getByLabel("Contraseña de acceso").fill(password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    try {
      await page.waitForURL("**/hub**", { timeout: 12000 });
    } catch {
      const apiResponse = await page.request.post(`${baseUrl}/api/auth/login`, {
        data: { email, password },
        headers: { origin: baseUrl, "content-type": "application/json" },
      });
      if (!apiResponse.ok()) {
        const loginBody = await page.locator("body").innerText();
        throw new Error(`Login fallido por UI y API. UI: ${loginBody.slice(0, 220)} API status: ${apiResponse.status()}`);
      }
      await page.goto(`${baseUrl}/hub`, { waitUntil: "networkidle", timeout: 120000 });
    }

    await page.goto(`${baseUrl}/hub/story`, { waitUntil: "networkidle", timeout: 120000 });
    const duelLink = page.locator("a[href*='/hub/story/chapter/']").first();
    if ((await duelLink.count()) < 1) throw new Error("No hay nodos de Story disponibles para este usuario.");
    const href = await duelLink.getAttribute("href");
    if (!href) throw new Error("No se pudo resolver href de duelo Story.");
    duelUrl = new URL(href, baseUrl).toString();
    await duelLink.click();
    await page.waitForURL("**/hub/story/chapter/**/duel/**", { timeout: 30000 });
    await page.waitForTimeout(2200);

    steps.push(await runStep(page, "Abrir acciones mobile", ["button[aria-label='Abrir acciones']", "button[aria-label='Cerrar acciones']"]));
    steps.push(await runStep(page, "Pasar a combate", ["button[aria-label='Pasar a combate']", "button:has-text('Combate')"]));
    steps.push(await runStep(page, "Seleccionar carta", ["button[aria-label*='Carta ']", "button[aria-label='Cambiar a ataque']"]));
    steps.push(await runStep(page, "Activar ejecución/trampa", ["button[aria-label='Activar ejecución seleccionada']", "button:has-text('Activar')"]));
    steps.push(await runStep(page, "Pasar turno", ["button[aria-label='Pasar turno']", "button:has-text('Pasar')"]));
    await page.waitForTimeout(1600);

    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes("Application error") || bodyText.includes("inválido")) error = bodyText.slice(0, 260);
    const metrics = await page.evaluate(() => window.__AIGIOH_COMBAT_PERF__ ?? { lcp: -1, cls: -1, inp: -1, longTasks: 0, longTaskMax: 0 });
    const payload = { generatedAt: new Date().toISOString(), baseUrl, profile, email, duelUrl, steps, metrics, error };
    const files = await writeReport(payload);
    console.log("Auditoría E2E real de combate completada.");
    console.log(`JSON: ${files.jsonPath}`);
    console.log(`MD: ${files.mdPath}`);
    await context.close();
  } finally {
    await browser.close();
    stopServer(serverProcess);
  }
}

main().catch((currentError) => {
  console.error(currentError);
  process.exit(1);
});
