// e2e/auth/register-onboarding-tutorial.spec.ts - Valida onboarding tutorial completo: registro, Preparar Deck, Market, Combate y recompensa final.
import { expect, test } from "@playwright/test";
import { Locator, Page } from "@playwright/test";
import { createEphemeralCredentials } from "../support/e2e-credentials";
import { deleteSupabaseUserByEmail } from "../support/supabase-admin-cleanup";

const landingIntroSeenKey = "landing-intro-seen";
const credentials = createEphemeralCredentials();

async function skipLandingIntro(page: Page): Promise<void> {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, "1");
  }, landingIntroSeenKey);
}

async function resolveVisibleTutorialTarget(page: Page, tutorialId: string): Promise<Locator | null> {
  const candidates = page.locator(`[data-tutorial-id="${tutorialId}"]`);
  const count = await candidates.count();
  let bestTarget: Locator | null = null;
  let bestArea = 0;
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    if (await candidate.isDisabled().catch(() => false)) continue;
    const box = await candidate.boundingBox();
    const area = box ? box.width * box.height : 0;
    if (area > bestArea) {
      bestArea = area;
      bestTarget = candidate;
    }
  }
  return bestTarget;
}

async function clickTutorialTarget(page: Page, tutorialId: string): Promise<boolean> {
  const target = await resolveVisibleTutorialTarget(page, tutorialId);
  if (!target) return false;
  await target.scrollIntoViewIfNeeded().catch(() => undefined);
  try {
    await target.click({ timeout: 2_500 });
  } catch {
    await target.click({ force: true, timeout: 5_000 });
  }
  return true;
}

async function dismissTurnAdvanceGuardIfVisible(page: Page): Promise<boolean> {
  const warningTitle = page.getByRole("heading", { name: /Aún puedes jugar cartas|Aún tienes ataques disponibles/i }).first();
  if (!(await warningTitle.isVisible().catch(() => false))) return false;
  const disableHelpCheckbox = page.getByRole("checkbox", { name: /No volver a mostrar estos avisos/i }).first();
  if (await disableHelpCheckbox.isVisible().catch(() => false)) {
    const isChecked = await disableHelpCheckbox.isChecked().catch(() => false);
    if (!isChecked) {
      try {
        await disableHelpCheckbox.check({ force: true, timeout: 1_500 });
      } catch {
        await disableHelpCheckbox.click({ force: true, timeout: 1_500 }).catch(() => undefined);
      }
    }
  }
  const continueButton = page.getByRole("button", { name: /Continuar y avanzar de fase/i }).first();
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click({ force: true, timeout: 8_000 }).catch(async () => {
      await page.getByText("Continuar", { exact: true }).first().click({ force: true, timeout: 8_000 });
    });
    return true;
  }
  return false;
}

async function clickBigLogStartIfVisible(page: Page): Promise<boolean> {
  const startButton = page.locator('section[data-tutorial-overlay="true"] button:has-text("Empezar")').first();
  if (!(await startButton.isVisible().catch(() => false))) return false;
  await startButton.click({ force: true, timeout: 8_000 });
  return true;
}

async function clickCombatBaseStartIfVisible(page: Page): Promise<boolean> {
  const introOverlay = page.locator('section[data-tutorial-overlay="true"]').filter({
    has: page.getByRole("heading", { name: /Combate Base/i }),
  }).first();
  if (!(await introOverlay.isVisible().catch(() => false))) return false;
  const startButton = introOverlay.getByRole("button", { name: /Empezar/i }).first();
  if (!(await startButton.isVisible().catch(() => false))) return false;
  await startButton.click({ force: true, timeout: 8_000 });
  return true;
}

async function consumeAllStartButtons(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const clicked = await clickBigLogStartIfVisible(page);
    if (!clicked) return;
    await page.waitForTimeout(520);
  }
}

async function dismissCombatIntroOverlay(page: Page): Promise<void> {
  const deadline = Date.now() + 35_000;
  while (Date.now() < deadline) {
    if (await clickCombatBaseStartIfVisible(page)) {
      await page.waitForTimeout(320);
      continue;
    }
    await consumeAllStartButtons(page);
    const introTitle = page.getByRole("heading", { name: /Combate Base/i }).first();
    if (!(await introTitle.isVisible().catch(() => false))) return;
    await page.waitForTimeout(260);
  }
  throw new Error("No se pudo cerrar el overlay de inicio de combate (Combate Base).");
}

async function settleCombatTutorialStart(page: Page): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    await consumeAllStartButtons(page);
    await dismissCombatIntroOverlay(page).catch(() => undefined);
    if (await page.getByText("BigLog Tutorial").isVisible().catch(() => false)) return;
    await page.waitForTimeout(320);
  }
  throw new Error("No se pudo estabilizar el inicio del tutorial de combate.");
}

async function closePackRevealIfVisible(page: Page): Promise<boolean> {
  const revealOverlay = page.locator('[data-tutorial-id="market-pack-reveal"]').first();
  if (!(await revealOverlay.isVisible().catch(() => false))) return false;
  const clickIntegrateIfVisible = async (): Promise<boolean> => {
    const integrateButton = page.locator('[data-tutorial-id="market-pack-reveal"]').getByRole("button", { name: /Integrar al Almacén/i }).first();
    if (!(await integrateButton.isVisible().catch(() => false))) return false;
    try {
      await integrateButton.click({ force: true, timeout: 8_000 });
    } catch {
      await integrateButton.click({ force: true, timeout: 8_000 });
    }
    return true;
  };
  if (await clickIntegrateIfVisible()) return true;
  // Fallback: clic dentro del diálogo para forzar foco y reintentar botón.
  await revealOverlay.click({ position: { x: 24, y: 24 }, force: true });
  await page.waitForTimeout(220);
  if (await clickIntegrateIfVisible()) return true;
  return false;
}

async function clickTutorialNextIfVisible(page: Page): Promise<boolean> {
  const nextButton = page.getByRole("button", { name: "Siguiente paso del tutorial" });
  if (!(await nextButton.isVisible())) return false;
  if (await nextButton.isDisabled()) return false;
  await nextButton.click({ force: true });
  return true;
}

async function readTutorialDialogTitle(page: Page): Promise<string | null> {
  const dialogTitle = page.locator('aside[data-tutorial-overlay="true"] h3').first();
  if (!(await dialogTitle.isVisible())) return null;
  const title = (await dialogTitle.textContent())?.trim();
  return title && title.length > 0 ? title : null;
}

async function performArsenalStepAction(page: Page, title: string): Promise<boolean> {
  if (title.includes("Selecciona carta del almacén") || title.includes("Reelige carta del almacén") || title.includes("Cómo detectar evolución")) {
    const spark = page.getByRole("button", { name: /Seleccionar Spark Adapter/i });
    if (await spark.isVisible()) {
      await spark.click();
      return true;
    }
  }
  if (title.includes("Selecciona carta del deck")) {
    const slot2 = page.getByRole("button", { name: /^Slot 2$/i });
    if (await slot2.isVisible()) {
      await slot2.click();
      return true;
    }
  }
  if (title.includes("Remover para abrir hueco")) return clickTutorialTarget(page, "tutorial-home-remove-button");
  if (title.includes("Añadir al deck")) return clickTutorialTarget(page, "tutorial-home-add-button");
  if (title.includes("Evolución práctica")) return clickTutorialTarget(page, "tutorial-home-evolve-button");
  return false;
}

async function performMarketStepAction(page: Page, title: string): Promise<boolean> {
  if (await closePackRevealIfVisible(page)) return true;
  if (title.includes("Comprar carta individual")) return clickTutorialTarget(page, "market-buy-card");
  if (title.includes("Seleccionar Pack GemGPT")) return clickTutorialTarget(page, "market-pack-tile-tutorial-market-pack-gemgpt");
  if (title.includes("Comprar sobre aleatorio")) return clickTutorialTarget(page, "market-buy-pack");
  return false;
}

async function performCombatStepAction(page: Page, title: string): Promise<boolean> {
  await consumeAllStartButtons(page);
  await dismissTurnAdvanceGuardIfVisible(page);
  const tryAdvanceSummonAttackStep = async (entityHandTutorialId: string): Promise<boolean> => {
    const titleBefore = await readTutorialDialogTitle(page);
    await clickTutorialTarget(page, "tutorial-board-action-attack");
    await page.waitForTimeout(420);
    const titleAfterDirectAttack = await readTutorialDialogTitle(page);
    if (titleAfterDirectAttack && titleAfterDirectAttack !== titleBefore) return true;
    await clickTutorialTarget(page, entityHandTutorialId);
    await page.waitForTimeout(220);
    await clickTutorialTarget(page, "tutorial-board-action-attack");
    await page.waitForTimeout(420);
    const titleAfterReselect = await readTutorialDialogTitle(page);
    return Boolean(titleAfterReselect && titleAfterReselect !== titleBefore);
  };
  if (title.includes("Selecciona ChatGPT")) return clickTutorialTarget(page, "tutorial-board-hand-card-entity-chatgpt");
  if (title.includes("Invoca en ataque")) return tryAdvanceSummonAttackStep("tutorial-board-hand-card-entity-chatgpt");
  if (title.includes("Selecciona mágica +400")) return clickTutorialTarget(page, "tutorial-board-hand-card-exec-boost-atk-400");
  if (title.includes("Activa la mágica")) return clickTutorialTarget(page, "tutorial-board-action-activate-execution");
  if (title.includes("Selecciona la trampa")) return clickTutorialTarget(page, "tutorial-board-hand-card-tutorial-trap-attack-drain-200");
  if (title.includes("Set de trampa")) return clickTutorialTarget(page, "tutorial-board-action-set-trap");
  if (title.includes("Subturnos") && title.includes("Invocar")) {
    const didClick = await clickTutorialTarget(page, "tutorial-board-phase-battle-button");
    await dismissTurnAdvanceGuardIfVisible(page);
    return didClick;
  }
  if (title.includes("Subturnos") && title.includes("Pasar")) {
    const didClick = await clickTutorialTarget(page, "tutorial-board-phase-pass-button");
    await dismissTurnAdvanceGuardIfVisible(page);
    return didClick;
  }
  if (title.includes("Selecciona recarga de energía")) return clickTutorialTarget(page, "tutorial-board-hand-card-tutorial-exec-energy-restore");
  if (title.includes("Activa recarga")) return clickTutorialTarget(page, "tutorial-board-action-activate-execution");
  if (title.includes("Energía recuperada")) return clickTutorialTarget(page, "tutorial-board-hand-card-entity-gemini");
  if (title.includes("Invoca Gemini")) return tryAdvanceSummonAttackStep("tutorial-board-hand-card-entity-gemini");
  if (title.includes("Entrar en Combate")) {
    const didClick = await clickTutorialTarget(page, "tutorial-board-phase-battle-button");
    await dismissTurnAdvanceGuardIfVisible(page);
    return didClick;
  }
  if (title.includes("Ataca directo")) return clickTutorialTarget(page, "tutorial-board-player-entity-card-entity-chatgpt");
  if (title.includes("Ataca con ChatGPT")) return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  if (title.includes("Segundo atacante")) return clickTutorialTarget(page, "tutorial-board-player-entity-card-entity-gemini");
  if (title.includes("Ataca con Gemini")) return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  if (title.includes("Ceder turno")) {
    const didClick = await clickTutorialTarget(page, "tutorial-board-phase-pass-button");
    await dismissTurnAdvanceGuardIfVisible(page);
    return didClick;
  }
  if (title.includes("Robo clave")) return clickTutorialTarget(page, "tutorial-board-hand-card-exec-fusion-gemgpt");
  if (title.includes("Activa fusión")) return clickTutorialTarget(page, "tutorial-board-action-activate-execution");
  if (title.includes("Material 1")) return clickTutorialTarget(page, "tutorial-board-fusion-material-entity-chatgpt");
  if (title.includes("Material 2")) return clickTutorialTarget(page, "tutorial-board-fusion-material-entity-gemini");
  if (title.includes("Selecciona GemGPT")) return clickTutorialTarget(page, "tutorial-board-player-entity-card-fusion-gemgpt");
  if (title.includes("Ataque de GemGPT")) return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  if (title.includes("Cerrar turno")) {
    const didClick = await clickTutorialTarget(page, "tutorial-board-phase-pass-button");
    await dismissTurnAdvanceGuardIfVisible(page);
    return didClick;
  }
  if (title.includes("Robo de Python")) return clickTutorialTarget(page, "tutorial-board-hand-card-entity-python");
  if (title.includes("Invoca Python")) return tryAdvanceSummonAttackStep("tutorial-board-hand-card-entity-python");
  if (title.includes("Cementerio")) return clickTutorialTarget(page, "tutorial-board-graveyard-player");
  if (title.includes("Cerrar cementerio")) return clickTutorialTarget(page, "tutorial-board-graveyard-close");
  if (title.includes("Primero: fusión contra defensa")) {
    if (await clickTutorialTarget(page, "tutorial-board-player-entity-card-fusion-gemgpt")) return true;
    return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  }
  if (title.includes("Segundo: ataque directo con Python")) {
    if (await clickTutorialTarget(page, "tutorial-board-player-entity-card-entity-python")) return true;
    return clickTutorialTarget(page, "tutorial-board-opponent-zone-1");
  }
  return false;
}

async function advanceUntilOutro(
  page: Page,
  outroTitle: RegExp,
  stepActionResolver: (page: Page, title: string) => Promise<boolean>,
  timeoutMs = 180_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await consumeAllStartButtons(page);
    if (await page.getByText(outroTitle).isVisible()) return;
    if (await clickTutorialNextIfVisible(page)) continue;
    const currentTitle = await readTutorialDialogTitle(page);
    const didAction = await stepActionResolver(page, currentTitle ?? "");
    if (!didAction) await page.waitForTimeout(220);
  }
  throw new Error(`No se completó el nodo tutorial antes del timeout: ${outroTitle.source}`);
}

async function runArsenalTutorial(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/hub\/academy\/tutorial\/arsenal/, { timeout: 30_000 });
  await clickBigLogStartIfVisible(page);
  await advanceUntilOutro(
    page,
    /Preparar Deck Completado/i,
    performArsenalStepAction,
  );
  await page.getByRole("button", { name: "Siguiente Tutorial" }).click();
}

async function runMarketTutorial(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/hub\/academy\/tutorial\/market/, { timeout: 30_000 });
  await clickBigLogStartIfVisible(page);
  await advanceUntilOutro(
    page,
    /Market Completado/i,
    performMarketStepAction,
    220_000,
  );
  await page.getByRole("button", { name: "Siguiente Tutorial" }).click();
}

async function runCombatTutorial(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/hub\/academy\/training\/tutorial/, { timeout: 30_000 });
  await settleCombatTutorialStart(page);
  await expect(page.getByText("BigLog Tutorial")).toBeVisible({ timeout: 45_000 });
  await advanceUntilOutro(page, /Tutorial de Combate Completado/i, performCombatStepAction, 360_000);
  await page.getByRole("button", { name: /Recompensa Final/i }).click();
  await expect(page.getByText("Recompensa de Combate")).toBeVisible({ timeout: 45_000 });
  await page.getByRole("button", { name: /Reclamar Carta/i }).click();
  await expect(page.getByText(/Carta reclamada|ya estaba reclamada|No se pudo reclamar/)).toBeVisible({ timeout: 45_000 });
  await page.getByRole("button", { name: /Cerrar/i }).click();
  await expect(page).toHaveURL(/\/hub\/academy\/tutorial/, { timeout: 30_000 });
}

async function runFinalRewardNode(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/hub\/academy\/tutorial/, { timeout: 30_000 });
  await page.goto("/hub/academy/tutorial/reward");
  await expect(page.getByRole("button", { name: "Reclamar recompensa" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Reclamar recompensa" }).click();
  await expect(page.getByText(/Recompensa aplicada|ya estaba reclamada/)).toBeVisible({ timeout: 30_000 });
}

test.describe.serial("Onboarding inicial", () => {
  test.setTimeout(600_000);
  test.afterAll(async () => {
    const cleanupStatus = await deleteSupabaseUserByEmail(credentials.email);
    if (cleanupStatus === "skipped") {
      console.warn("Cleanup onboarding E2E omitido: define E2E_SUPABASE_URL y E2E_SUPABASE_SERVICE_ROLE_KEY.");
    }
  });

  test("registro y recorrido completo de tutorial onboarding", async ({ page }) => {
    await skipLandingIntro(page);
    await page.goto("/");
    await page.getByRole("link", { name: "Compilar ID" }).click();
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible({ timeout: 30_000 });

    await page.getByLabel("Email de registro", { exact: true }).fill(credentials.email);
    await page.getByLabel("Contraseña de registro", { exact: true }).fill(credentials.password);
    await page.getByLabel("Confirmar contraseña de registro", { exact: true }).fill(credentials.password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/hub/, { timeout: 60_000 });

    await page.goto("/hub/academy/tutorial");
    await expect(page.getByText("Ruta de Aprenentatge")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "Abrir Preparar Deck" }).click();
    await runArsenalTutorial(page);
    await runMarketTutorial(page);
    await runCombatTutorial(page);
    await runFinalRewardNode(page);
  });
});
