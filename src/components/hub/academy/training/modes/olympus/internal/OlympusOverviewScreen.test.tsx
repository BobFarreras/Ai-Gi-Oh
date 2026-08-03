// src/components/hub/academy/training/modes/olympus/internal/OlympusOverviewScreen.test.tsx - Verifica intentos, bloqueo de campeones y confirmación antes de gastar intento.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OlympusMode } from "../useOlympusMode";
import { IOlympusChampionCard, IOlympusLegendCard, IOlympusOverview } from "../olympus-api-client";
import { OlympusOverviewScreen } from "./OlympusOverviewScreen";

const champion = (id: string, unlocked: boolean): IOlympusChampionCard => ({
  champion: {
    id, arenaOpponentId: `arena-${id}`, requiredTier: 3, requiredLadderPosition: 3,
    baseDeckVariantId: "variant", baseScale: { level: 20, versionTier: 4, startingLp: 8000 }, version: 1,
  },
  nodes: [{
    id: `${id}-power-1`, championId: id, branch: "POWER", prerequisiteNodeIds: [],
    effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 100 }, fragmentCost: 40, maxRank: 16, sortOrder: 10,
  }],
  progress: { championId: id, unlockedNodeIds: [], nodeRanks: {}, respecCount: 0, version: 1 },
  unlocked,
  displayName: id === "gennvim" ? "GenNvim" : "Helena",
  avatarUrl: null,
  introUrl: null,
});

const legend = {
  id: "zeus", code: "ZEUS", displayName: "Zeus", deckTemplateId: "gokernel-ultra",
  aiProfile: "MYTHIC", startingLp: 14000, energyBonus: 2, rewardDefinitionId: "olympus-v1-zeus",
  avatarPath: null, introPath: null, victoryPath: null, defeatPath: null,
  lore: "Custodio del núcleo.", specialRules: ["Comienza con 14.000 LP"],
  baseFragmentReward: 150, firstVictoryFragmentBonus: 400, defeatFragmentReward: 20,
  sortOrder: 10, version: 1,
  nexusReward: 300, cardRewardId: "fusion-gemgpt", cardRewardFirstVictoryOnly: true,
  // Resuelta en servidor: es lo que el selector pinta, no un `get` contra el catálogo de código.
  rewardCard: { id: "fusion-gemgpt", name: "GemGPT", renderUrl: "/assets/renders/gemgpt.webp" },
} as IOlympusLegendCard;

function overviewWith(overrides: Partial<IOlympusOverview>): IOlympusOverview {
  return {
    settings: {
      version: 1, dailyAttemptLimit: 3, battleTtlMinutes: 45,
      respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 75,
    },
    allowance: {
      periodKey: "2026-08-01", attemptsUsed: 1, dailyLimit: 3,
      attemptsRemaining: 2, nextResetIso: "2026-08-02T00:00:00.000Z",
    },
    legends: [legend],
    champions: [champion("gennvim", true), champion("helena", false)],
    ascensionFragments: 320,
    defeatedLegendIds: [],
    pendingBattle: null,
    ...overrides,
  };
}

function modeWith(overview: IOlympusOverview | null): OlympusMode {
  return {
    overview, battle: null, settlement: null, error: null, isLoading: false,
    reloadOverview: vi.fn(), enterBattle: vi.fn(), recordAction: vi.fn(), completeBattle: vi.fn(),
    dismissBattle: vi.fn(), clearError: vi.fn(), purchaseUpgrade: vi.fn(), respecUpgrades: vi.fn(),
  } as unknown as OlympusMode;
}

describe("OlympusOverviewScreen", () => {
  it("muestra los intentos restantes del día", () => {
    render(<OlympusOverviewScreen mode={modeWith(overviewWith({}))} onEnterBattle={vi.fn()} />);
    expect(screen.getByLabelText(/2 de 3 intentos disponibles/i)).toBeInTheDocument();
  });

  it("deja elegir el campeón desbloqueado y bloquea el resto con su requisito", () => {
    render(<OlympusOverviewScreen mode={modeWith(overviewWith({}))} onEnterBattle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Elegir a GenNvim/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Helena bloqueado: derrótalo en el nivel 3/i })).toBeDisabled();
  });

  it("nunca gasta un intento sin confirmación explícita", () => {
    const onEnterBattle = vi.fn();
    render(<OlympusOverviewScreen mode={modeWith(overviewWith({}))} onEnterBattle={onEnterBattle} />);

    fireEvent.click(screen.getByRole("button", { name: /Elegir combate contra la leyenda/i }));

    expect(onEnterBattle).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // El diálogo anticipa cuántos intentos quedarán antes de confirmar.
    expect(screen.getByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Confirmar y empezar el combate/i }));
    expect(onEnterBattle).toHaveBeenCalledWith("gennvim", "zeus");
  });

  it("retomar un combate pendiente no pasa por la confirmación de intento", () => {
    const onEnterBattle = vi.fn();
    const pendingBattle = {
      battleId: "battle-1", playerId: "p1", championId: "gennvim", opponentId: "zeus",
      periodKey: "2026-08-01", attemptNumber: 1, status: "ISSUED" as const, outcome: null, reward: null,
    };
    render(<OlympusOverviewScreen mode={modeWith(overviewWith({ pendingBattle }))} onEnterBattle={onEnterBattle} />);

    fireEvent.click(screen.getByRole("button", { name: /Retomar el combate pendiente/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onEnterBattle).toHaveBeenCalledWith("gennvim", "zeus");
  });

  it("bloquea el desafío cuando se agotan los intentos", () => {
    const allowance = {
      periodKey: "2026-08-01", attemptsUsed: 3, dailyLimit: 3,
      attemptsRemaining: 0, nextResetIso: "2026-08-02T00:00:00.000Z",
    };
    render(<OlympusOverviewScreen mode={modeWith(overviewWith({ allowance }))} onEnterBattle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Elegir combate contra la leyenda/i })).toBeDisabled();
    expect(screen.getByText(/Sin intentos hasta el reset/i)).toBeInTheDocument();
  });

  it("deja ver el mazo prestado del campeón elegido, no el de la leyenda", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        championId: "gennvim", displayName: "GenNvim", deck: [], fusionDeck: [],
        level: 29, versionTier: 4, startingLp: 8000, energyBonus: 0,
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<OlympusOverviewScreen mode={modeWith(overviewWith({}))} onEnterBattle={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Ver el mazo prestado de GenNvim/i }));

    await waitFor(() => expect(screen.getByRole("dialog", { name: /Mazo prestado de GenNvim/i })).toBeInTheDocument());
    expect(fetchSpy.mock.calls[0][0]).toContain("championId=gennvim");
    vi.unstubAllGlobals();
  });

  it("explica qué hacer cuando no hay campeones desbloqueados", () => {
    const champions = [champion("helena", false)];
    render(<OlympusOverviewScreen mode={modeWith(overviewWith({ champions }))} onEnterBattle={vi.fn()} />);
    expect(screen.getByText(/Derrota a los rivales de Arena clásica/i)).toBeInTheDocument();
  });
});
