// e2e/combat/combat-tutorial-fusion.spec.ts - Valida en tutorial la secuencia de fusión ChatGPT+Gemini+Fusion Compiler hasta ataque de GemGPT.
import { expect, Page, test } from "@playwright/test";
import { loginAsStandardUser } from "../support/e2e-session";
import { clickTutorialTarget, dismissTurnAdvanceGuardIfVisible } from "./combat-helpers";

async function clickStartIfVisible(page: Page): Promise<boolean> {
  const button = page.locator('section[data-tutorial-overlay="true"] button:has-text("Empezar")').first();
  if (!(await button.isVisible().catch(() => false))) return false;
  await button.click({ force: true });
  return true;
}

async function consumeStartButtons(page: Page): Promise<void> {
  for (let index = 0; index < 8; index += 1) {
    const clicked = await clickStartIfVisible(page);
    if (!clicked) return;
    await page.waitForTimeout(350);
  }
}

async function clickNextIfVisible(page: Page): Promise<boolean> {
  const next = page.getByRole("button", { name: "Siguiente paso del tutorial" }).first();
  if (!(await next.isVisible().catch(() => false))) return false;
  if (await next.isDisabled().catch(() => false)) return false;
  await next.click({ force: true });
  return true;
}

async function readStep(page: Page): Promise<{ title: string; description: string }> {
  const title = page.locator('aside[data-tutorial-overlay="true"] h3').first();
  const description = page.locator('aside[data-tutorial-overlay="true"] p').nth(1);
  if (!(await title.isVisible().catch(() => false))) return { title: "", description: "" };
  return {
    title: ((await title.textContent()) ?? "").trim(),
    description: ((await description.textContent()) ?? "").trim(),
  };
}

async function activateExecutionWithCard(page: Page, cardId: string): Promise<boolean> {
  if (await clickTutorialTarget(page, "tutorial-board-action-activate-execution")) return true;
  if (!(await clickTutorialTarget(page, cardId))) return false;
  await page.waitForTimeout(120);
  return clickTutorialTarget(page, "tutorial-board-action-activate-execution");
}

async function clickBattlePhase(page: Page): Promise<boolean> {
  if (await clickTutorialTarget(page, "tutorial-board-phase-battle-button")) return true;
  const byRole = page.getByRole("button", { name: /Combate/i }).first();
  if (!(await byRole.isVisible().catch(() => false))) return false;
  await byRole.click({ force: true });
  return true;
}

async function clickPassPhase(page: Page): Promise<boolean> {
  if (await clickTutorialTarget(page, "tutorial-board-phase-pass-button")) return true;
  const byRole = page.getByRole("button", { name: /^Pasar$/i }).first();
  if (!(await byRole.isVisible().catch(() => false))) return false;
  await byRole.click({ force: true });
  return true;
}

async function resolveAction(page: Page, title: string, description: string): Promise<boolean> {
  if (!title) return false;
  if (title.includes("Selecciona ChatGPT")) return clickTutorialTarget(page, "tutorial-board-hand-card-entity-chatgpt");
  if (title.includes("Invoca en ataque")) return clickTutorialTarget(page, "tutorial-board-action-attack");
  if (title.includes("Selecciona mágica +400")) return clickTutorialTarget(page, "tutorial-board-hand-card-exec-boost-atk-400");
  if (title.includes("Activa la mágica")) return activateExecutionWithCard(page, "tutorial-board-hand-card-exec-boost-atk-400");
  if (title.includes("Selecciona la trampa")) return clickTutorialTarget(page, "tutorial-board-hand-card-tutorial-trap-attack-drain-200");
  if (title.includes("Set de trampa")) return clickTutorialTarget(page, "tutorial-board-action-set-trap");
  if (title.includes("Subturnos") && description.includes("Pulsa Combate")) return clickBattlePhase(page);
  if (title.includes("Subturnos") && description.includes("pulsa Pasar")) return clickPassPhase(page);
  if (title.includes("Selecciona recarga de energía")) return clickTutorialTarget(page, "tutorial-board-hand-card-tutorial-exec-energy-restore");
  if (title.includes("Activa recarga")) return activateExecutionWithCard(page, "tutorial-board-hand-card-tutorial-exec-energy-restore");
  if (title.includes("Energía recuperada")) return clickTutorialTarget(page, "tutorial-board-hand-card-entity-gemini");
  if (title.includes("Invoca Gemini")) return clickTutorialTarget(page, "tutorial-board-action-attack");
  if (title.includes("Entrar en Combate")) return clickBattlePhase(page);
  if (title.includes("Ataca directo")) return clickTutorialTarget(page, "tutorial-board-player-entity-card-entity-chatgpt");
  if (title.includes("Ataca con ChatGPT") || title.includes("Ataca con Gemini")) return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  if (title.includes("Segundo atacante")) return clickTutorialTarget(page, "tutorial-board-player-entity-card-entity-gemini");
  if (title.includes("Ceder turno") || title.includes("Cerrar turno")) return clickPassPhase(page);
  if (title.includes("Robo clave")) return clickTutorialTarget(page, "tutorial-board-hand-card-exec-fusion-gemgpt");
  if (title.includes("Activa fusión")) return activateExecutionWithCard(page, "tutorial-board-hand-card-exec-fusion-gemgpt");
  if (title.includes("Material 1")) return clickTutorialTarget(page, "tutorial-board-fusion-material-entity-chatgpt");
  if (title.includes("Material 2")) return clickTutorialTarget(page, "tutorial-board-fusion-material-entity-gemini");
  if (title.includes("Fase de Combate")) return clickBattlePhase(page);
  if (title.includes("Selecciona GemGPT")) return clickTutorialTarget(page, "tutorial-board-player-entity-card-fusion-gemgpt");
  if (title.includes("Ataque de GemGPT")) return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  return false;
}

test.describe.serial("Combat tutorial fusion", () => {
  test.setTimeout(240_000);

  test("completa la secuencia de fusión GemGPT", async ({ page }) => {
    await loginAsStandardUser(page);
    await page.goto("/hub/academy/training/tutorial");
    await expect(page).toHaveURL(/\/hub\/academy\/training\/tutorial/, { timeout: 30_000 });

    const deadline = Date.now() + 220_000;
    let fusionBrowserSeen = false;
    let fusionCardSeen = false;
    let fusionAttackDone = false;
    while (Date.now() < deadline) {
      await consumeStartButtons(page);
      await dismissTurnAdvanceGuardIfVisible(page);
      if (await clickNextIfVisible(page)) continue;
      if (await page.locator('[data-tutorial-id="tutorial-board-fusion-browser"]').first().isVisible().catch(() => false)) fusionBrowserSeen = true;
      if (await page.locator('[data-tutorial-id="tutorial-board-player-entity-card-fusion-gemgpt"]').first().isVisible().catch(() => false)) fusionCardSeen = true;
      const step = await readStep(page);
      const acted = await resolveAction(page, step.title, step.description);
      await dismissTurnAdvanceGuardIfVisible(page);
      if (step.title.includes("Ataque de GemGPT") && acted) {
        fusionAttackDone = true;
        break;
      }
      await page.waitForTimeout(140);
    }

    expect(fusionBrowserSeen).toBeTruthy();
    expect(fusionCardSeen).toBeTruthy();
    expect(fusionAttackDone).toBeTruthy();
  });
});
