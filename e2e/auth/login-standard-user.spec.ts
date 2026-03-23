// e2e/auth/login-standard-user.spec.ts - Valida login con usuario estándar reutilizable para suites funcionales de market/home/combat.
import { expect, test } from "@playwright/test";
import { getStandardCredentials } from "../support/e2e-credentials";

test("login con usuario estándar reusable", async ({ context, page }) => {
  const credentials = getStandardCredentials();
  await context.clearCookies();
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();

  await page.getByLabel("Email de acceso", { exact: true }).fill(credentials.email);
  await page.getByLabel("Contraseña de acceso", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page).toHaveURL(/\/hub/, { timeout: 60_000 });
});
