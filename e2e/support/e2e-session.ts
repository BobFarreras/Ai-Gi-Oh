// e2e/support/e2e-session.ts - Helpers compartidos de autenticación y navegación para suites E2E funcionales.
import { expect, Page } from "@playwright/test";
import { getStandardCredentials } from "./e2e-credentials";

const landingIntroSeenKey = "landing-intro-seen";

/**
 * Evita overlays introductorios para estabilizar los flujos E2E repetibles.
 */
export async function applyStableE2EStorage(page: Page): Promise<void> {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, "1");
  }, landingIntroSeenKey);
}

/**
 * Autentica el usuario estándar reusable y espera redirección al Hub.
 */
export async function loginAsStandardUser(page: Page): Promise<void> {
  const credentials = getStandardCredentials();
  await applyStableE2EStorage(page);
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Email de acceso", { exact: true }).fill(credentials.email);
  await page.getByLabel("Contraseña de acceso", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/hub/, { timeout: 60_000 });
}
