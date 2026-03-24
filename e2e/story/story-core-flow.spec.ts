// e2e/story/story-core-flow.spec.ts - Valida Story real: acción principal, recompensas y transición de acto cuando están desbloqueadas.
import { expect, Locator, test } from "@playwright/test";
import { loginAsStandardUser } from "../support/e2e-session";
import {
  clickStorySmartAction,
  findStorySmartActionButton,
  openStoryAndAssertLoaded,
  selectUnlockedNodeByAriaPattern,
  waitForStoryActionOutcome,
} from "./story-helpers";

async function findRunnableNodeAndSelect(page: Parameters<typeof waitForStoryActionOutcome>[0]): Promise<{ button: Locator; isDuel: boolean } | null> {
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

test.describe.serial("Story real", () => {
  test("seleccionar nodo ejecutable y validar resultado", async ({ page }) => {
    await loginAsStandardUser(page);
    await openStoryAndAssertLoaded(page);

    const runnableNode = await findRunnableNodeAndSelect(page);
    if (!runnableNode) {
      test.skip(true, "No hay nodos desbloqueados con acción ejecutable en este estado de Story.");
    }
    if (!runnableNode) return;

    await clickStorySmartAction(page);
    const outcome = await waitForStoryActionOutcome(page);
    expect(["DUEL_ROUTE", "STORY_FEEDBACK"]).toContain(outcome);
  });

  test("recoger recompensa de NEXUS o carta cuando exista nodo desbloqueado", async ({ page }) => {
    await loginAsStandardUser(page);
    await openStoryAndAssertLoaded(page);

    const rewardNode =
      (await selectUnlockedNodeByAriaPattern(page, /Seleccionar nodo .*reward.*nexus/i)) ??
      (await selectUnlockedNodeByAriaPattern(page, /Seleccionar nodo .*reward.*card/i));

    if (!rewardNode) {
      test.skip(true, "No hay nodo de recompensa desbloqueado (NEXUS/carta) para este usuario.");
    }
    if (!rewardNode) return;

    await clickStorySmartAction(page);
    const outcome = await waitForStoryActionOutcome(page);
    expect(outcome).toBe("STORY_FEEDBACK");

    const hasRewardFeedback =
      (await page.getByText(/NEXUS obtenido|Carta obtenida/i).first().isVisible().catch(() => false)) ||
      (await page.getByRole("button", { name: /Siguiente diálogo|Cerrar/i }).first().isVisible().catch(() => false));

    expect(hasRewardFeedback).toBeTruthy();
  });

  test("cambiar al acto 2 mediante nodo de transición cuando esté disponible", async ({ page }) => {
    await loginAsStandardUser(page);
    await openStoryAndAssertLoaded(page, 1);

    const transitionNode = await selectUnlockedNodeByAriaPattern(page, /Seleccionar nodo story-ch1-transition-to-act2/i);
    if (!transitionNode) {
      test.skip(true, "No hay transición desbloqueada de acto 1 a acto 2 para este usuario.");
    }
    if (!transitionNode) return;

    await clickStorySmartAction(page);
    await expect(page).toHaveURL(/\/hub\/story\?act=2/, { timeout: 15_000 });
  });
});
