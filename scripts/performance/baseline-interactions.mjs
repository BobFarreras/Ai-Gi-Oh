// scripts/performance/baseline-interactions.mjs - Ejecuta interacciones táctiles mínimas para provocar métricas INP por escenario.
async function safeTap(locator) {
  try {
    if ((await locator.count()) < 1) return false;
    await locator.first().click({ timeout: 2500 });
    return true;
  } catch {
    return false;
  }
}

async function fallbackTap(page) {
  try {
    const viewport = page.viewportSize();
    const x = Math.floor((viewport?.width ?? 412) * 0.5);
    const y = Math.floor((viewport?.height ?? 915) * 0.55);
    await page.mouse.click(x, y);
    return true;
  } catch {
    return false;
  }
}

async function runTaps(page, selectors) {
  let executed = 0;
  for (const selector of selectors) {
    const ok = await safeTap(page.locator(selector));
    await page.waitForTimeout(250);
    if (ok) {
      executed += 1;
      break;
    }
  }
  return executed;
}

export async function runScenarioInteractions(page, scenarioId) {
  let interactions = 0;
  await page.waitForTimeout(900);
  if (scenarioId === "home") {
    interactions += await runTaps(page, ['button[aria-label*="Seleccionar"]', "button[aria-label*='Carta']", "button"]);
    interactions += await runTaps(page, ["button:has-text('Añadir')", "button:has-text('Insertar')", "button:has-text('Remover')"]);
  } else if (scenarioId === "market") {
    interactions += await runTaps(page, ["button[aria-label*='Seleccionar']", "button:has-text('Comprar')", "button"]);
    interactions += await runTaps(page, ["button:has-text('Comprar')", "button:has-text('Pack')", "button"]);
  } else {
    interactions += await runTaps(page, ["button:has-text('Atq')", "button:has-text('Def')", "button:has-text('Activar')", "button"]);
  }
  if (interactions < 1) {
    const fallbackOk = await fallbackTap(page);
    if (fallbackOk) interactions += 1;
  }
  if (interactions < 2 && scenarioId !== "combat") {
    await page.mouse.wheel(0, 420);
    await page.waitForTimeout(250);
    const fallbackOk = await fallbackTap(page);
    if (fallbackOk) interactions += 1;
  }
  await page.waitForTimeout(1200);
  return interactions;
}
