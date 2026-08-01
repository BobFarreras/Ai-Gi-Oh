// src/components/admin/AdminPveModesPanel.test.tsx - Verifica navegación por pestañas y que publicar envía la configuración derivada del formulario.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPveModesPanel } from "./AdminPveModesPanel";

const snapshot = {
  survivalRulesets: [{
    version: 1, startTier: 4, battlesPerTier: 2, roster: ["training-tier-1", "training-gokernel"],
    milestoneInterval: 5, milestoneHeal: 2000, isActive: true, publishedAtIso: "2026-07-31T10:00:00.000Z",
    stages: [{
      fromBattle: 1, aiProfile: "HARD", maxTier: 8,
      maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "survival-base",
    }],
  }],
  olympusSettings: [{
    version: 1, dailyAttemptLimit: 3, battleTtlMinutes: 45, respecFreeAllowance: 1,
    respecCost: 60, respecRefundPercent: 75, isActive: true, publishedAtIso: "2026-07-31T10:00:00.000Z",
  }],
  legends: [],
  champions: [],
  arenaOpponents: [{
    id: "training-tier-1",
    displayName: "GenNvim",
    avatarUrl: "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp",
    variants: [{ id: "starter-tools", label: "Starter Tools", deckCount: 20, fusionCount: 2 }],
  }],
  validCards: [],
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string) => ({
    ok: true,
    json: async () => (url.endsWith("/pve-modes") ? snapshot : { ok: true }),
  }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("AdminPveModesPanel", () => {
  it("abre en Supervivencia con la versión activa y su roster con caras", async () => {
    render(<AdminPveModesPanel />);

    expect(await screen.findByText(/Reglas base · versión activa v1/i)).toBeInTheDocument();
    // El roster deja de ser texto suelto: cada rival se reconoce por su nombre y su avatar.
    expect(screen.getAllByText("GenNvim").length).toBeGreaterThan(0);
    // El rival que ya no existe en Arena se señala en vez de guardarse en silencio.
    expect(screen.getAllByText("training-gokernel").length).toBeGreaterThan(0);
    expect(screen.getByText(/No existe en Arena/i)).toBeInTheDocument();
  });

  it("simula el escalado de los primeros combates con el resolutor real", async () => {
    render(<AdminPveModesPanel />);
    await screen.findByText(/Reglas base · versión activa v1/i);

    expect(screen.getByText(/Así se jugará/i)).toBeInTheDocument();
    // El ruleset del fixture arranca en el tier 4 y sube uno cada dos combates.
    expect(screen.getAllByText("T4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HARD").length).toBeGreaterThan(0);
  });

  it("cambia a la configuración de Olimpo y muestra sus valores vigentes", async () => {
    render(<AdminPveModesPanel />);
    await screen.findByText(/Reglas base · versión activa v1/i);

    fireEvent.click(screen.getByRole("button", { name: /Ver Config Olimpo/i }));

    expect(await screen.findByLabelText(/Intentos por día/i)).toHaveValue("3");
    expect(screen.getByLabelText(/Coste de respec/i)).toHaveValue("60");
  });

  it("publica la configuración de Olimpo editada como versión nueva", async () => {
    render(<AdminPveModesPanel />);
    await screen.findByText(/Reglas base · versión activa v1/i);
    fireEvent.click(screen.getByRole("button", { name: /Ver Config Olimpo/i }));

    const limitField = await screen.findByLabelText(/Intentos por día/i);
    fireEvent.change(limitField, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /Publicar nueva versión de la configuración/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/pve-modes/upsert",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const call = fetchMock.mock.calls.find(([url]) => url === "/api/admin/pve-modes/upsert");
    expect(JSON.parse((call?.[1] as { body: string }).body)).toEqual({
      type: "olympus-settings",
      data: {
        dailyAttemptLimit: 5, battleTtlMinutes: 45, respecFreeAllowance: 1,
        respecCost: 60, respecRefundPercent: 75,
      },
    });
  });
});
