// e2e/hub/player-profile-name-flow.spec.ts - Cubre edición y persistencia de nickname de operador en Hub con cuenta efímera.
import { expect, test, type Page } from "@playwright/test";
import { applyStableE2EStorage } from "../support/e2e-session";
import { createEphemeralCredentials } from "../support/e2e-credentials";

function createTemporaryNickname(): string {
  const suffix = Date.now().toString().slice(-6);
  return `E2E_${suffix}`;
}

async function readHudPlayerName(page: Page): Promise<string> {
  const userButton = page.getByRole("button", { name: "Editar nombre del operador" });
  await expect(userButton).toBeVisible({ timeout: 30_000 });
  return (await userButton.locator("p").first().innerText()).trim();
}

async function updateProfileNameViaApi(page: Page, nextName: string): Promise<void> {
  await page.evaluate(async (nickname) => {
    const response = await fetch("/api/player/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, strategy: "force" }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message ?? `Error HTTP ${response.status}`);
    }
  }, nextName);
}

test("editar nickname de operador persiste tras recarga de hub", async ({ page }) => {
  const credentials = createEphemeralCredentials();
  await applyStableE2EStorage(page);
  await page.goto("/register");
  await page.getByLabel("Email de registro", { exact: true }).fill(credentials.email);
  await page.getByLabel("Contraseña de registro", { exact: true }).fill(credentials.password);
  await page.getByLabel("Confirmar contraseña de registro", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/hub/, { timeout: 60_000 });

  await readHudPlayerName(page);
  const temporaryName = createTemporaryNickname();
  await updateProfileNameViaApi(page, temporaryName);
  await page.reload();
  await expect(page.getByText(temporaryName, { exact: true })).toBeVisible({ timeout: 20_000 });
});
