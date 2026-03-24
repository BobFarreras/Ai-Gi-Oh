// e2e/market/market-core-flow.spec.ts - Valida flujo real de Market: compra individual, compra de pack, integración y trazabilidad en historial.
import { expect, Locator, Page, test } from "@playwright/test";
import { loginAsStandardUser } from "../support/e2e-session";

async function resolveVisibleByTutorialId(page: Page, tutorialId: string): Promise<Locator | null> {
  const candidates = page.locator(`[data-tutorial-id="${tutorialId}"]`);
  const count = await candidates.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    return candidate;
  }
  return null;
}

async function clickTutorialTarget(page: Page, tutorialId: string): Promise<boolean> {
  const target = await resolveVisibleByTutorialId(page, tutorialId);
  if (!target) return false;
  await target.scrollIntoViewIfNeeded().catch(() => undefined);
  await target.click({ force: true, timeout: 8_000 });
  return true;
}

async function readWalletNexus(page: Page): Promise<number> {
  const headerText = await page.locator("header").first().innerText();
  const matches = [...headerText.matchAll(/(\d+)\s*NX/gi)];
  if (matches.length === 0) throw new Error("No se pudo leer saldo NX del header de Market.");
  return Number(matches[0]?.[1] ?? "0");
}

async function findBuyableListingAndSelect(page: Page): Promise<boolean> {
  const listingButtons = page.getByRole("button", { name: /Seleccionar /i });
  const buyCardButton = page.locator('[data-tutorial-id="market-buy-card"]').first();
  const count = await listingButtons.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = listingButtons.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    await candidate.click({ force: true });
    await page.waitForTimeout(220);
    if (await buyCardButton.isEnabled().catch(() => false)) return true;
  }
  return false;
}

async function readHistoryCount(page: Page): Promise<number> {
  const panel = page.locator('[data-tutorial-id="market-history-panel"]').first();
  if (!(await panel.isVisible().catch(() => false))) return 0;
  return panel.locator("article").count();
}

test.describe.serial("Market real", () => {
  test("comprar carta + comprar pack + integrar + validar historial", async ({ page }) => {
    await loginAsStandardUser(page);
    await page.goto("/hub/market");
    await expect(page.getByRole("heading", { name: "Mercado" })).toBeVisible({ timeout: 30_000 });
    if (await page.getByText("Sección bloqueada").isVisible().catch(() => false)) {
      test.skip(true, "Market bloqueado para este usuario. Completa Academy o habilita salto de tutorial.");
    }

    const walletBefore = await readWalletNexus(page);
    await clickTutorialTarget(page, "market-history-tab");
    await expect(page.locator('[data-tutorial-id="market-history-panel"]')).toBeVisible({ timeout: 10_000 });
    const historyBefore = await readHistoryCount(page);
    await clickTutorialTarget(page, "market-vault-collection-tab");

    let successfulPurchases = 0;
    const buyCardButton = page.locator('[data-tutorial-id="market-buy-card"]').first();
    const hasBuyableListing = await findBuyableListingAndSelect(page);
    if (hasBuyableListing) {
      await expect(buyCardButton).toBeEnabled({ timeout: 8_000 });
      await buyCardButton.click({ force: true });
      await page.waitForTimeout(1_000);
      successfulPurchases += 1;
    } else {
      test.info().annotations.push({
        type: "warning",
        description: "No se encontró listing comprable en esta ejecución de Market.",
      });
    }

    const hasPackTile = await page.locator('[data-tutorial-id^="market-pack-tile-"]').first().isVisible().catch(() => false);
    if (hasPackTile) {
      await page.locator('[data-tutorial-id^="market-pack-tile-"]').first().click({ force: true });
      const didClickBuyPack = await clickTutorialTarget(page, "market-buy-pack");
      if (didClickBuyPack) {
        const revealOverlay = page.locator('[data-tutorial-id="market-pack-reveal"]').first();
        await expect(revealOverlay).toBeVisible({ timeout: 30_000 });
        await page.getByRole("button", { name: /Integrar al Almacén/i }).first().click({ force: true });
        await expect(revealOverlay).not.toBeVisible({ timeout: 20_000 });
        successfulPurchases += 1;
      }
    }

    const walletAfter = await readWalletNexus(page);
    expect(walletAfter).toBeLessThanOrEqual(walletBefore);

    await clickTutorialTarget(page, "market-history-tab");
    await expect(page.locator('[data-tutorial-id="market-history-panel"]')).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => readHistoryCount(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(historyBefore + successfulPurchases);
  });
});
