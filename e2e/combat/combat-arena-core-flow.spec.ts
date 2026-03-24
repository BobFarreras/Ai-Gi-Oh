// e2e/combat/combat-arena-core-flow.spec.ts - Valida flujo real de combate arena: controles HUD, fases, invocación, ataque y mecánicas avanzadas disponibles.
import { expect, Page, test } from "@playwright/test";
import { loginAsStandardUser } from "../support/e2e-session";
import {
  clickTutorialTarget,
  dismissTurnAdvanceGuardIfVisible,
  findFirstHandCard,
  toggleBoardButtonAndAssert,
  verifyPauseResumeCycle,
  verifyCombatLogPanel,
  waitForArenaBoardReady,
} from "./combat-helpers";

const debugHoldMs = Number.parseInt(process.env.E2E_DEBUG_HOLD_MS ?? "0", 10);

async function maybeSummon(page: Page, mode: "attack" | "defense"): Promise<boolean> {
  const handCard = await findFirstHandCard(page);
  if (!handCard) return false;
  await handCard.click({ force: true });
  const actionId = mode === "attack" ? "tutorial-board-action-attack" : "tutorial-board-action-defense";
  return clickTutorialTarget(page, actionId);
}

async function tryAdvanceToBattleAndPass(page: Page): Promise<void> {
  await clickTutorialTarget(page, "tutorial-board-phase-battle-button");
  await dismissTurnAdvanceGuardIfVisible(page);
  await clickTutorialTarget(page, "tutorial-board-phase-pass-button");
  await dismissTurnAdvanceGuardIfVisible(page);
}

async function tryAttackSequence(page: Page): Promise<boolean> {
  const attacker = page.locator('[data-tutorial-id^="tutorial-board-player-entity-card-"]').first();
  if (!(await attacker.isVisible().catch(() => false))) return false;
  await attacker.click({ force: true });
  return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
}

async function tryPlayHandAction(page: Page, actionId: string): Promise<boolean> {
  const cards = page.locator('[data-tutorial-id^="tutorial-board-hand-card-"]');
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    if (!(await card.isVisible().catch(() => false))) continue;
    await card.click({ force: true });
    await page.waitForTimeout(120);
    if (await clickTutorialTarget(page, actionId)) return true;
  }
  return false;
}

async function tryFusionSequence(page: Page): Promise<boolean> {
  const fusionCard = page.locator('[data-tutorial-id*="hand-card"][data-tutorial-id*="fusion"]').first();
  if (!(await fusionCard.isVisible().catch(() => false))) return false;
  await fusionCard.click({ force: true });
  if (!(await clickTutorialTarget(page, "tutorial-board-action-activate-execution"))) return false;
  const fusionBrowser = page.locator('[data-tutorial-id="tutorial-board-fusion-browser"]').first();
  if (!(await fusionBrowser.isVisible().catch(() => false))) return false;
  const materials = page.locator('[data-tutorial-id^="tutorial-board-fusion-material-"]');
  const count = await materials.count();
  if (count < 2) return false;
  await materials.nth(0).click({ force: true });
  await materials.nth(1).click({ force: true });
  return true;
}

async function tryOpenCloseGraveyard(page: Page): Promise<boolean> {
  if (!(await clickTutorialTarget(page, "tutorial-board-graveyard-player"))) return false;
  const browser = page.locator('[data-tutorial-id="tutorial-board-graveyard-browser"]').first();
  if (!(await browser.isVisible().catch(() => false))) return false;
  if (!(await clickTutorialTarget(page, "tutorial-board-graveyard-close"))) return false;
  await expect(browser).toHaveCount(0, { timeout: 8_000 });
  return true;
}

test.describe.serial("Combat arena real", () => {
  test.setTimeout(180_000);

  test("valida controles, fases y acciones base de combate", async ({ page }) => {
    await loginAsStandardUser(page);
    await page.goto("/hub/academy/training/arena?tier=1");

    const deckGate = page.getByText(/Deck incompleto/i).first();
    if (await deckGate.isVisible().catch(() => false)) {
      test.skip(true, "El usuario estándar no tiene deck 20/20 para entrar en arena.");
    }

    await page.getByRole("button", { name: /Empezar Combate/i }).click({ force: true });
    await waitForArenaBoardReady(page);

    await verifyPauseResumeCycle(page);
    await toggleBoardButtonAndAssert(page, "tutorial-board-mute-button", /Silenciar/i, /Activar sonido/i);
    await toggleBoardButtonAndAssert(page, "tutorial-board-mute-button", /Activar sonido/i, /Silenciar/i);

    const autoButton = page.locator('[data-tutorial-id="tutorial-board-auto-button"]').first();
    const autoBefore = (await autoButton.getAttribute("aria-label")) ?? "";
    await autoButton.click({ force: true });
    await expect.poll(async () => (await autoButton.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).not.toBe(autoBefore);
    await autoButton.click({ force: true });
    await expect.poll(async () => (await autoButton.getAttribute("aria-label")) ?? "", { timeout: 8_000 }).toBe(autoBefore);
    await verifyCombatLogPanel(page);

    const setTrapDone = await tryPlayHandAction(page, "tutorial-board-action-set-trap");
    const setExecutionDone = await tryPlayHandAction(page, "tutorial-board-action-set-execution");
    let activateSetDone = false;
    if (setExecutionDone) {
      const setCard = page.locator('[data-tutorial-id^="tutorial-board-player-entity-card-"]').first();
      if (await setCard.isVisible().catch(() => false)) {
        await setCard.click({ force: true });
        const activateSetButton = page.getByRole("button", { name: /Activar carta en set seleccionada/i }).first();
        if (await activateSetButton.isVisible().catch(() => false)) {
          await activateSetButton.click({ force: true });
          activateSetDone = true;
        }
      }
    }

    const summonedDefense = await maybeSummon(page, "defense");
    await tryAdvanceToBattleAndPass(page);
    await page.waitForTimeout(1_800);

    const summonedAttack = await maybeSummon(page, "attack");
    await clickTutorialTarget(page, "tutorial-board-phase-battle-button");
    await dismissTurnAdvanceGuardIfVisible(page);
    const attacked = await tryAttackSequence(page);

    const fusionAttempted = await tryFusionSequence(page);
    const directAttackAttempted = await clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
    const graveyardOpenedAndClosed = await tryOpenCloseGraveyard(page);
    if (!summonedDefense) {
      test.info().annotations.push({ type: "warning", description: "No se pudo validar invocación en defensa en esta partida (estado de mano/fase)." });
    }
    if (!setTrapDone) {
      test.info().annotations.push({ type: "warning", description: "No se pudo validar acción de set de trampa en esta partida (mano/fase)." });
    }
    if (!setExecutionDone) {
      test.info().annotations.push({ type: "warning", description: "No se pudo validar acción de set de ejecución en esta partida (mano/fase)." });
    }
    if (!activateSetDone) {
      test.info().annotations.push({ type: "warning", description: "No se pudo validar activación de carta en set seleccionada en esta partida." });
    }
    if (!fusionAttempted) {
      test.info().annotations.push({ type: "warning", description: "No se pudo completar secuencia de fusión en esta partida (carta/materiales no disponibles)." });
    }
    if (!directAttackAttempted) {
      test.info().annotations.push({ type: "warning", description: "No se pudo forzar intento de ataque directo en esta partida (estado del campo)." });
    }
    if (!graveyardOpenedAndClosed) {
      test.info().annotations.push({ type: "warning", description: "No se pudo validar apertura/cierre de cementerio en esta partida." });
    }

    await clickTutorialTarget(page, "tutorial-board-history-button");
    await expect(page.getByText("Combat Log")).toBeVisible({ timeout: 10_000 });
    if (Number.isFinite(debugHoldMs) && debugHoldMs > 0) {
      await page.waitForTimeout(debugHoldMs);
    }
    await expect(page.getByText(/No hay eventos para estos filtros/i)).toHaveCount(0);

    expect(summonedAttack || summonedDefense || setTrapDone || setExecutionDone).toBeTruthy();
    if (!attacked) {
      test.info().annotations.push({ type: "warning", description: "No se pudo validar ataque efectivo contra zona rival en esta partida." });
    }
  });
});
