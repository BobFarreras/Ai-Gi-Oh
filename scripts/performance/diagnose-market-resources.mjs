// scripts/performance/diagnose-market-resources.mjs - Diagnostica recursos lentos en Market móvil bajo perfil de estrés.
import { chromium } from "playwright";

async function run() {
  const baseUrl = process.env.PERF_BASE_URL ?? "http://localhost:3000";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto(`${baseUrl}/hub/market`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => {
        const current = entry;
        return {
          name: current.name,
          type: current.initiatorType,
          duration: current.duration,
          transferSize: current.transferSize ?? 0,
        };
      })
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 15),
  );
  await browser.close();
  console.log(JSON.stringify(resources, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
