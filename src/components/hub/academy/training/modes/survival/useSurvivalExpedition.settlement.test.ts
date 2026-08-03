// src/components/hub/academy/training/modes/survival/useSurvivalExpedition.settlement.test.ts - Verifica que liquidar no saca al jugador del tablero antes de ver la experiencia.
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSurvivalExpedition } from "./useSurvivalExpedition";

const settlement = {
  settled: true,
  run: { id: "run-1", status: "ACTIVE", currentLp: 5000, maxLp: 8000, wins: 4 },
  progress: { bestWins: 6, ascensionFragments: 90 },
  battle: { battleId: "battle-1", milestoneHeal: 0 },
  outcome: "WIN",
  reward: { ascensionFragments: 12, definitionId: "base", milestoneReached: false },
  duplicate: false,
};

const runtime = {
  battle: { battleId: "battle-1", battleIndex: 4, startingLp: 6000, effectiveTier: 5, ascensionRank: 0 },
  resumed: false,
  aiProfile: "HARD",
  session: { id: "session-1", battleId: "battle-1", seed: "seed", snapshotHash: "hash", protocolVersion: 3, playerId: "p1", opponentId: "o1" },
  initialState: { playerA: { id: "p1" }, playerB: { id: "o1" }, combatLog: [] },
  completionTicket: "ticket",
  presentation: { displayName: "Helena", avatarUrl: "/h.webp" },
  journalEntries: [],
};

const completeSurvivalBattle = vi.fn(async () => settlement);

vi.mock("./survival-api-client", () => ({
  startSurvivalRun: vi.fn(async () => ({
    run: settlement.run, progress: settlement.progress, resumed: false,
    forfeitedPreviousRun: false, milestoneInterval: 5, milestoneHeal: 2000,
  })),
  issueSurvivalBattle: vi.fn(async () => runtime),
  completeSurvivalBattle: (...args: unknown[]) => completeSurvivalBattle(...(args as [])),
}));

afterEach(() => completeSurvivalBattle.mockClear());

describe("useSurvivalExpedition · liquidación e informe", () => {
  it("liquida al acabar el duelo pero NO muestra el informe: el overlay de experiencia debe verse", async () => {
    const { result } = renderHook(() => useSurvivalExpedition());
    await act(async () => { await result.current.enterBattle(); });

    await act(async () => { await result.current.completeBattle(); });

    expect(completeSurvivalBattle).toHaveBeenCalledOnce();
    // El servidor ya cobró —abandonar no sale gratis— pero la pantalla sigue en el tablero.
    expect(result.current.settlement).toBeNull();
  });

  it("muestra el informe cuando el jugador lo pide, sin volver a liquidar", async () => {
    const { result } = renderHook(() => useSurvivalExpedition());
    await act(async () => { await result.current.enterBattle(); });
    await act(async () => { await result.current.completeBattle(); });

    await act(async () => { await result.current.revealSettlement(); });

    await waitFor(() => expect(result.current.settlement).not.toBeNull());
    // La segunda llamada reutiliza lo ya liquidado: nada de cobrar dos veces.
    expect(completeSurvivalBattle).toHaveBeenCalledOnce();
  });

  it("avisa cuando el servidor no da el combate por terminado, en vez de dejar el botón muerto", async () => {
    // El servidor reproduce el diario y no ve desenlace: antes se hacía `return` en silencio y el
    // jugador se quedaba atrapado pulsando «Ver informe» sin que pasara nada.
    completeSurvivalBattle.mockResolvedValueOnce({ settled: false, journalLength: 12 } as never);
    const { result } = renderHook(() => useSurvivalExpedition());
    await act(async () => { await result.current.enterBattle(); });

    await act(async () => { await result.current.revealSettlement(); });

    expect(result.current.settlement).toBeNull();
    await waitFor(() => expect(result.current.error).toMatch(/no da este combate por terminado/i));
  });
});
