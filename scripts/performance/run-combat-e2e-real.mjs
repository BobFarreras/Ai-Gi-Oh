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

async function clickFirstEnabled(page, selectors, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const selector of selectors) {
      const locator = page.locator(selector).first();
      if ((await locator.count()) < 1) continue;
      const visible = await locator.isVisible().catch(() => false);
      const enabled = await locator.isEnabled().catch(() => false);
      if (!visible || !enabled) continue;
      await locator.click({ timeout: 1500 });
      return selector;
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`No se encontró control habilitado para selectors: ${selectors.join(" | ")}`);
}

async function runStrictStep(page, label, selectors, timeoutMs = 12000) {
  const startedAt = Date.now();
  const selector = await clickFirstEnabled(page, selectors, timeoutMs);
  await page.waitForTimeout(420);
  return { label, ok: true, selector, durationMs: Date.now() - startedAt };
}

async function playAnyValidHandAction(page) {
  const startedAt = Date.now();
  const handCards = page.locator("button[aria-label^='Carta ']");
  const count = await handCards.count();
  const actionPriority = [
    "button[aria-label='Activar ejecución desde mano']",
    "button[aria-label='Armar trampa']",
    "button[aria-label='Invocar en ataque']",
    "button[aria-label='Invocar en defensa']",
    "button[aria-label='Colocar ejecución en set']",
  ];
  for (let index = 0; index < count; index += 1) {
    const card = handCards.nth(index);
    if (!(await card.isVisible().catch(() => false))) continue;
    await card.click({ timeout: 1500 });
    await page.waitForTimeout(250);
    for (const actionSelector of actionPriority) {
      const button = page.locator(actionSelector).first();
      if ((await button.count()) > 0 && (await button.isVisible().catch(() => false)) && (await button.isEnabled().catch(() => false))) {
        await button.click({ timeout: 1500 });
        await page.waitForTimeout(420);
        return { label: "Jugar carta desde mano", ok: true, selector: actionSelector, durationMs: Date.now() - startedAt };
      }
    }
    const closeButton = page.locator("button[aria-label='Cerrar selección']").first();
    if ((await closeButton.count()) > 0) {
      await closeButton.click({ timeout: 1500 });
      await page.waitForTimeout(180);
    }
  }
  throw new Error("No se encontró ninguna acción válida de mano para ejecutar de forma determinista.");
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

    steps.push(await runStrictStep(page, "Abrir acciones mobile", ["button[aria-label='Abrir acciones']", "button[aria-label='Cerrar acciones']"]));
    steps.push(await playAnyValidHandAction(page));
    steps.push(await runStrictStep(page, "Pasar a combate", ["button[aria-label='Pasar a combate']", "button:has-text('Combate')"]));
    steps.push(await runStrictStep(page, "Abrir historial", ["button[aria-label='Abrir historial']", "button[aria-label='Cerrar historial']"]));
    steps.push(await runStrictStep(page, "Cerrar historial", ["button[aria-label='Cerrar historial']", "button[aria-label='Abrir historial']"]));
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
