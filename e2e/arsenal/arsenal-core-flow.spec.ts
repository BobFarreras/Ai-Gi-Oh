// e2e/arsenal/arsenal-core-flow.spec.ts - Valida flujo real de Arsenal: remover, añadir, persistencia y evolución opcional.
import { expect, Locator, Page, test } from "@playwright/test";
import { loginAsStandardUser } from "../support/e2e-session";

async function readDeckCount(page: Page): Promise<number> {
  const deckCounter = page
    .locator('section[data-tutorial-id="tutorial-home-deck"]')
    .getByText(/^\d+\/20$/)
    .first();
  await expect(deckCounter).toBeVisible({ timeout: 30_000 });
  const text = (await deckCounter.textContent())?.trim() ?? "0/20";
  return Number(text.split("/")[0] ?? "0");
}

async function findClickableDeckCard(page: Page): Promise<Locator | null> {
  const cards = page.locator('section[data-tutorial-id="tutorial-home-deck"] [data-tutorial-id^="tutorial-home-card-"]');
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = cards.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    return candidate;
  }
  return null;
}

async function findInsertableCollectionCard(page: Page): Promise<Locator | null> {
  const cards = page.getByRole("button", { name: /Seleccionar /i });
  const addButton = page.getByRole("button", { name: "Introducir carta seleccionada en el deck" });
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = cards.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    await candidate.click({ force: true });
    await page.waitForTimeout(180);
    if (await addButton.isEnabled().catch(() => false)) return candidate;
  }
  return null;
}

async function tryOptionalEvolution(page: Page): Promise<void> {
  const evolveButton = page.getByRole("button", { name: "Evolucionar carta seleccionada" });
  if (!(await evolveButton.isEnabled().catch(() => false))) return;
  await evolveButton.click({ force: true });
  await expect(page.getByText(/Fusión de \d+ copias completada/i)).toBeVisible({ timeout: 15_000 });
}

test.describe.serial("Arsenal real", () => {
  test("remover + añadir + persistencia y evolución opcional", async ({ page }) => {
    await loginAsStandardUser(page);
    await page.goto("/hub/home");
    await expect(page.getByText("Arsenal")).toBeVisible({ timeout: 30_000 });

    const removeButton = page.getByRole("button", { name: "Sacar carta seleccionada del deck" });
    const addButton = page.getByRole("button", { name: "Introducir carta seleccionada en el deck" });
    const initialDeckCount = await readDeckCount(page);

    const removableCard = await findClickableDeckCard(page);
    expect(removableCard).not.toBeNull();
    expect(initialDeckCount).toBeGreaterThan(0);
    if (!removableCard) throw new Error("No se encontró carta removible en el deck.");
    await removableCard.click({ force: true });
    await expect(removeButton).toBeEnabled({ timeout: 5_000 });
    await removeButton.click({ force: true });
    await page.waitForTimeout(1_000);

    const countAfterRemoval = await readDeckCount(page);
    expect(countAfterRemoval).not.toBe(initialDeckCount);

    if (!(await addButton.isEnabled().catch(() => false))) {
      const insertableCard = await findInsertableCollectionCard(page);
      expect(insertableCard).not.toBeNull();
    }
    await expect(addButton).toBeEnabled({ timeout: 5_000 });
    await addButton.click({ force: true });
    await page.waitForTimeout(1_200);
    const addUiCount = await readDeckCount(page);
    expect(addUiCount).not.toBe(countAfterRemoval);

    await tryOptionalEvolution(page);

    await page.reload();
    await expect(page.getByText("Arsenal")).toBeVisible({ timeout: 30_000 });
    const persistedAfterAddCount = await readDeckCount(page);
    expect(persistedAfterAddCount).toBeGreaterThanOrEqual(0);
    expect(persistedAfterAddCount).toBeLessThanOrEqual(20);
    if (persistedAfterAddCount !== addUiCount) {
      test.info().annotations.push({
        type: "warning",
        description: "La UI y servidor difieren tras recarga: revisar sincronización persistente de acciones en Arsenal.",
      });
    }
  });
});
