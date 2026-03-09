// scripts/performance/run-mobile-baseline.mjs - Ejecuta baseline móvil automatizado con Playwright y exporta reporte.
import { chromium } from "playwright";
import { MOBILE_DEVICE, NETWORK_PRESETS, buildScenarios } from "./baseline-config.mjs";
import { installWebVitalsObservers, readWebVitals } from "./baseline-observer.mjs";
import { runScenarioInteractions } from "./baseline-interactions.mjs";
import { writeReports } from "./baseline-report.mjs";
import { maybeStartServer, stopServer } from "./baseline-server.mjs";

function readArg(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : fallback;
}

async function applyThrottling(page, profile) {
  const cdp = await page.context().newCDPSession(page);
  const network = NETWORK_PRESETS[profile];
  await cdp.send("Network.enable");
  if (network) await cdp.send("Network.emulateNetworkConditions", network);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile === "stress" ? 4 : 1 });
}

async function measureScenario(browser, baseUrl, profile, scenario) {
  const context = await browser.newContext({
    viewport: MOBILE_DEVICE.viewport,
    userAgent: MOBILE_DEVICE.userAgent,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("debug-performance", "1");
      } catch {
        // ignore
      }
    });
    await installWebVitalsObservers(page);
    await applyThrottling(page, profile);
    await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle", timeout: 60000 });
    const interactionsExecuted = await runScenarioInteractions(page, scenario.id);
    const metrics = await readWebVitals(page);
    const interactions = await page.evaluate(() => {
      const perfStore = window.__AIGIOH_PERF__?.interactions ?? [];
      return perfStore.slice(-20);
    });
    return { profile, scenario: scenario.id, path: scenario.path, metrics, interactions, interactionsExecuted, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fallo desconocido";
    return { profile, scenario: scenario.id, path: scenario.path, metrics: { lcp: -1, cls: -1, inp: -1 }, interactions: [], interactionsExecuted: 0, error: message };
  } finally {
    await context.close();
  }
}

async function main() {
  const baseUrl = readArg("baseUrl", process.env.PERF_BASE_URL ?? "http://localhost:3000");
  const profileArg = readArg("profile", "both");
  const combatPath = readArg("combatPath", process.env.PERF_COMBAT_PATH ?? "/hub/story/chapter/1/duel/0");
  const startServer = readArg("startServer", "");
  const profiles = profileArg === "both" ? ["realistic", "stress"] : [profileArg];
  const scenarios = buildScenarios(combatPath);
  const serverProcess = await maybeStartServer(startServer, baseUrl);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const profile of profiles) {
      for (const scenario of scenarios) {
        const result = await measureScenario(browser, baseUrl, profile, scenario);
        results.push(result);
      }
    }
  } finally {
    await browser.close();
    stopServer(serverProcess);
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    device: MOBILE_DEVICE.name,
    profiles,
    results,
  };
  const files = await writeReports(payload);
  console.log(`Baseline completado.`);
  console.log(`JSON: ${files.jsonPath}`);
  console.log(`MD: ${files.mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
