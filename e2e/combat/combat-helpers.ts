// e2e/combat/combat-helpers.ts - Utilidades E2E para estabilizar interacciones del tablero de combate en arena.
import { expect, Locator, Page } from "@playwright/test";

/** Localiza el candidato visible más grande para un `data-tutorial-id` concreto. */
export async function resolveVisibleTutorialTarget(page: Page, tutorialId: string): Promise<Locator | null> {
  const candidates = page.locator(`[data-tutorial-id="${tutorialId}"]`);
  const count = await candidates.count();
  let best: Locator | null = null;
  let bestArea = 0;
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    if (await candidate.isDisabled().catch(() => false)) continue;
    const box = await candidate.boundingBox();
    const area = box ? box.width * box.height : 0;
    if (area > bestArea) {
      bestArea = area;
      best = candidate;
    }
  }
  return best;
}

/** Hace click robusto sobre un target tutorial sin fallar por overlays transitorios. */
export async function clickTutorialTarget(page: Page, tutorialId: string): Promise<boolean> {
  const target = await resolveVisibleTutorialTarget(page, tutorialId);
  if (!target) return false;
  await target.scrollIntoViewIfNeeded().catch(() => undefined);
  try {
    await target.click({ timeout: 2_000 });
  } catch {
    try {
      await target.click({ force: true, timeout: 5_000 });
    } catch {
      try {
        await target.evaluate((node) => {
          (node as HTMLElement).click();
        });
      } catch {
        return false;
      }
    }
  }
  return true;
}

/** Cierra el modal de guardia de fase para no bloquear el avance del turno en E2E. */
export async function dismissTurnAdvanceGuardIfVisible(page: Page): Promise<void> {
  const warningTitle = page.getByRole("heading", { name: /Aún puedes jugar cartas|Aún tienes ataques disponibles/i }).first();
  if (!(await warningTitle.isVisible().catch(() => false))) return;
  const checkbox = page.getByRole("checkbox", { name: /No volver a mostrar estos avisos/i }).first();
  if (await checkbox.isVisible().catch(() => false)) {
    const checked = await checkbox.isChecked().catch(() => false);
    if (!checked) await checkbox.click({ force: true }).catch(() => undefined);
  }
  const continueButton = page.getByRole("button", { name: /Continuar y avanzar de fase/i }).first();
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click({ force: true, timeout: 7_000 }).catch(async () => {
      await page.getByText("Continuar", { exact: true }).first().click({ force: true, timeout: 7_000 });
    });
  }
}

/** Espera a que el tablero de arena esté listo y sin lobby inicial. */
export async function waitForArenaBoardReady(page: Page): Promise<void> {
  await expect(page.locator('[data-tutorial-id="tutorial-board-phase-controls"]').first()).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("button", { name: /Empezar Combate/i })).toHaveCount(0, { timeout: 45_000 });
}

/** Alterna un botón de toggle del tablero verificando que cambie su `aria-label`. */
export async function toggleBoardButtonAndAssert(page: Page, tutorialId: string, before: RegExp, after: RegExp): Promise<void> {
  const button = page.locator(`[data-tutorial-id="${tutorialId}"]`).first();
  await expect(button).toBeVisible({ timeout: 20_000 });
  const ariaBefore = (await button.getAttribute("aria-label")) ?? "";
  expect(ariaBefore).toMatch(before);
  await button.click({ force: true });
  await expect.poll(async () => (await button.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).toMatch(after);
}

/** Garantiza estado no pausado y valida ciclo pausa->reanudar usando el overlay oficial. */
export async function verifyPauseResumeCycle(page: Page): Promise<void> {
  const pauseButton = page.locator('[data-tutorial-id="tutorial-board-pause-button"]').first();
  await expect(pauseButton).toBeVisible({ timeout: 20_000 });

  const closePauseOverlayIfOpen = async (): Promise<void> => {
    const resumeButton = page.getByRole("button", { name: /Reanudar partida/i }).first();
    if (await resumeButton.isVisible().catch(() => false)) {
      await resumeButton.click({ force: true });
      await expect(resumeButton).toHaveCount(0, { timeout: 10_000 });
    }
  };

  await closePauseOverlayIfOpen();
  await expect.poll(async () => (await pauseButton.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).toMatch(/Pausar/i);
  await pauseButton.click({ force: true });
  await expect(page.getByRole("button", { name: /Reanudar partida/i }).first()).toBeVisible({ timeout: 8_000 });
  await closePauseOverlayIfOpen();
  await expect.poll(async () => (await pauseButton.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).toMatch(/Pausar/i);
}

/** Devuelve la primera carta de mano visible para ejecutar acciones de invocación/uso. */
export async function findFirstHandCard(page: Page): Promise<Locator | null> {
  const cards = page.locator('[data-tutorial-id^="tutorial-board-hand-card-"]');
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = cards.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    return candidate;
  }
  return null;
}

/** Intenta abrir historial y cerrarlo validando que el panel renderiza correctamente. */
export async function verifyCombatLogPanel(page: Page): Promise<void> {
  const toggle = page.locator('[data-tutorial-id="tutorial-board-history-button"]').first();
  await toggle.click({ force: true });
  await expect(page.getByText("Combat Log")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Cerrar combat log|Cerrar historial/i }).first().click({ force: true });
}
