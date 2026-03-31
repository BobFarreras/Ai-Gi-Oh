// e2e/story/story-helpers.ts - Utilidades Playwright para navegación robusta de nodos Story y validación de resultados.
import { expect, Locator, Page } from "@playwright/test";

const duelUrlMatcher = /\/hub\/story\/chapter\/\d+\/duel\/\d+/;

/**
 * Localiza el botón de acción inteligente activo dentro del sidebar Story.
 */
export async function findStorySmartActionButton(page: Page): Promise<Locator | null> {
  const buttons = page.locator("aside button");
  const count = await buttons.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = buttons.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    if (await candidate.isDisabled().catch(() => false)) continue;
    const ariaLabel = await candidate.getAttribute("aria-label");
    if (ariaLabel?.includes("Cerrar telemetría")) continue;
    return candidate;
  }
  return null;
}

/**
 * Selecciona el primer nodo desbloqueado cuyo `aria-label` contenga el patrón indicado.
 */
export async function selectUnlockedNodeByAriaPattern(page: Page, pattern: RegExp): Promise<Locator | null> {
  const nodeButtons = page.getByRole("button", { name: /Seleccionar nodo /i });
  const count = await nodeButtons.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = nodeButtons.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    if (await candidate.isDisabled().catch(() => false)) continue;
    const ariaLabel = (await candidate.getAttribute("aria-label")) ?? "";
    if (!pattern.test(ariaLabel)) continue;
    await candidate.click({ force: true });
    await page.waitForTimeout(250);
    return candidate;
  }
  return null;
}

/**
 * Ejecuta la acción principal del nodo actualmente seleccionado.
 */
export async function clickStorySmartAction(page: Page): Promise<void> {
  const smartActionButton = await findStorySmartActionButton(page);
  expect(smartActionButton).not.toBeNull();
  if (!smartActionButton) throw new Error("No se encontró botón de acción inteligente en sidebar Story.");
  await smartActionButton.click({ force: true });
}

/**
 * Espera resultado de acción Story: ruta a duelo o feedback en escena.
 */
export async function waitForStoryActionOutcome(page: Page): Promise<"DUEL_ROUTE" | "STORY_FEEDBACK"> {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (duelUrlMatcher.test(page.url())) return "DUEL_ROUTE";
    if (await page.getByText(/^SYS:/).first().isVisible().catch(() => false)) return "STORY_FEEDBACK";
    if (await page.getByText(/^ERR:/).first().isVisible().catch(() => false)) return "STORY_FEEDBACK";
    if (await page.getByRole("button", { name: /Siguiente diálogo|Cerrar/i }).first().isVisible().catch(() => false)) return "STORY_FEEDBACK";
    await page.waitForTimeout(300);
  }
  throw new Error("No se detectó resultado de la acción Story (ruta a duelo o feedback de interacción).");
}

/**
 * Abre la Story y valida que la vista principal cargó correctamente.
 */
export async function openStoryAndAssertLoaded(page: Page, act?: number): Promise<void> {
  const path = typeof act === "number" ? `/hub/story?act=${act}` : "/hub/story";
  await page.goto(path);
  await expect(page.getByRole("heading", { name: /Acto|Mercado|Story|Capítulo|Capitulo/i }).first()).toBeVisible({ timeout: 30_000 });
}
