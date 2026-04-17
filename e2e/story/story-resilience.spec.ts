// e2e/story/story-resilience.spec.ts - Cubre regresiones de hidratación/mute y salida de duelo Story con cierre backend correcto.
import { expect, Locator, Page, test } from "@playwright/test";
import { loginAsStandardUser } from "../support/e2e-session";
import { clickStorySmartAction, findStorySmartActionButton, openStoryAndAssertLoaded, waitForStoryActionOutcome } from "./story-helpers";

function captureHydrationErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    const message = String(error?.message ?? "");
    if (message.includes("Hydration failed")) errors.push(message);
  });
  page.on("console", (message) => {
    const text = message.text();
    if (text.includes("Hydration failed")) errors.push(text);
  });
  return errors;
}

async function findRunnableNodeAndSelect(page: Page): Promise<{ button: Locator; isDuel: boolean } | null> {
  const nodeButtons = page.getByRole("button", { name: /Seleccionar nodo /i });
  const count = await nodeButtons.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = nodeButtons.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    if (await candidate.isDisabled().catch(() => false)) continue;
    await candidate.click({ force: true });
    await page.waitForTimeout(220);
    const smartActionButton = await findStorySmartActionButton(page);
    if (!smartActionButton) continue;
    if (!(await smartActionButton.isEnabled().catch(() => false))) continue;
    const aria = (await candidate.getAttribute("aria-label")) ?? "";
    return { button: candidate, isDuel: /duel/i.test(aria) };
  }
  return null;
}

test.describe.serial("Story resilience", () => {
  test("no rompe hidratación al entrar con soundtrack muteado en localStorage", async ({ page }) => {
    await loginAsStandardUser(page);
    await page.evaluate(() => window.localStorage.setItem("story-map-muted", "1"));
    const hydrationErrors = captureHydrationErrors(page);
    await page.goto("/hub/story");
    await expect(page.getByRole("heading", { name: /Acto|Capítulo|Capitulo/i }).first()).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => hydrationErrors.length, { timeout: 4_000 }).toBe(0);
    await expect(page.getByRole("button", { name: /Activar sonido del mapa/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("persiste estado mute tras recarga sin mismatch de hidratación", async ({ page }) => {
    await loginAsStandardUser(page);
    await openStoryAndAssertLoaded(page);
    const hydrationErrors = captureHydrationErrors(page);
    const muteButton = page.getByRole("button", { name: /Silenciar sonido del mapa|Activar sonido del mapa/i }).first();
    await expect(muteButton).toBeVisible({ timeout: 15_000 });
    const beforeLabel = (await muteButton.getAttribute("aria-label")) ?? "";
    await muteButton.click({ force: true });
    await expect.poll(async () => (await muteButton.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).not.toBe(beforeLabel);
    const expectedAfterReload = (await muteButton.getAttribute("aria-label")) ?? "";
    await page.reload();
    await expect(page.getByRole("heading", { name: /Acto|Capítulo|Capitulo/i }).first()).toBeVisible({ timeout: 30_000 });
    const muteButtonAfterReload = page.getByRole("button", { name: /Silenciar sonido del mapa|Activar sonido del mapa/i }).first();
    await expect.poll(async () => (await muteButtonAfterReload.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).toBe(expectedAfterReload);
    await expect.poll(() => hydrationErrors.length, { timeout: 4_000 }).toBe(0);
  });

  test("abandonar duelo story registra cierre sin 400", async ({ page }) => {
    await loginAsStandardUser(page);
    await openStoryAndAssertLoaded(page);
    const runnableNode = await findRunnableNodeAndSelect(page);
    if (!runnableNode) test.skip(true, "No hay nodos desbloqueados con acción ejecutable en este estado de Story.");
    if (!runnableNode) return;
    await clickStorySmartAction(page);
    const outcome = await waitForStoryActionOutcome(page);
    if (outcome !== "DUEL_ROUTE") test.skip(true, "El nodo ejecutable seleccionado no era duelo en este estado.");
    if (outcome !== "DUEL_ROUTE") return;

    await expect(page.locator('[data-tutorial-id="tutorial-board-pause-button"]').first()).toBeVisible({ timeout: 45_000 });
    const completionResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/api/story/duels/complete"),
      { timeout: 45_000 },
    );
    await page.locator('[data-tutorial-id="tutorial-board-pause-button"]').first().click({ force: true });
    await page.getByRole("button", { name: /Desconectar y Salir/i }).first().click({ force: true });
    const completionResponse = await completionResponsePromise;
    expect(completionResponse.status()).toBe(200);
    await expect(page).toHaveURL(/\/hub\/story\?/, { timeout: 30_000 });
    await expect(page).toHaveURL(/duelOutcome=ABANDONED|duelOutcome=LOST/, { timeout: 30_000 });
  });
});
