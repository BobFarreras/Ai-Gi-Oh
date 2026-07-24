// use-story-duel-result-sync.test.ts - Pulsar "Volver al mundo" antes de que aterrice el cierre NO puede dar
// el duelo por perdido: con `outcome=LOST` el overworld reaparece en el spawn y una VICTORIA acababa
// devolviendo al jugador al inicio del acto (bug reportado en el boss del Acto 4 y en las emboscadas).
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStoryDuelResultSync } from "./use-story-duel-result-sync";

const postStoryDuelCompletion = vi.hoisted(() => vi.fn());
vi.mock("../story-duel-completion-client", () => ({ postStoryDuelCompletion }));
vi.mock("@/services/analytics/client/analytics-buffer", () => ({ track: vi.fn() }));

const SYNC_INPUT = {
  chapter: 4,
  duelIndex: 7,
  completionTicket: "ticket",
  returnBasePath: "/hub/story/overworld",
};

const WIN_PAYLOAD = {
  rewardNexus: 100,
  rewardPlayerExperience: 50,
  rewardCards: [],
  penaltyNexus: 0,
  passiveNexusCredited: 0,
  duelNodeId: "story-ch4-duel-7",
  returnNodeId: "story-ch4-duel-7",
};

let replace: ReturnType<typeof vi.fn>;

beforeEach(() => {
  replace = vi.fn();
  Object.defineProperty(window, "location", { value: { replace }, writable: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

/** Resultado de victoria del motor para el jugador local. */
const WIN_RESULT = { winnerPlayerId: "player-1", playerId: "player-1" };

describe("useStoryDuelResultSync", () => {
  it("espera al cierre en vuelo antes de volver al mapa y conserva la VICTORIA", async () => {
    let resolvePost: (payload: typeof WIN_PAYLOAD) => void = () => undefined;
    postStoryDuelCompletion.mockReturnValueOnce(new Promise((resolve) => { resolvePost = resolve; }));
    const { result } = renderHook(() => useStoryDuelResultSync(SYNC_INPUT));

    act(() => { void result.current.handleMatchResolved(WIN_RESULT); });
    // El jugador pulsa "Volver al mundo" con el POST todavía en vuelo.
    act(() => { void result.current.handleResultAction(); });
    expect(replace).not.toHaveBeenCalled();

    await act(async () => { resolvePost(WIN_PAYLOAD); });
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(replace.mock.calls[0][0]).toContain("outcome=WON");
  });

  it("reintenta el cierre si falló y solo entonces vuelve, sin inventar una derrota", async () => {
    postStoryDuelCompletion.mockRejectedValueOnce(new Error("red caída"));
    postStoryDuelCompletion.mockResolvedValueOnce(WIN_PAYLOAD);
    const { result } = renderHook(() => useStoryDuelResultSync(SYNC_INPUT));

    await act(async () => { await result.current.handleMatchResolved(WIN_RESULT); });
    await act(async () => { await result.current.handleResultAction(); });

    expect(postStoryDuelCompletion).toHaveBeenCalledTimes(2);
    expect(replace.mock.calls[0][0]).toContain("outcome=WON");
  });

  it("si el servidor nunca confirma, vuelve con el resultado REAL conocido en cliente", async () => {
    postStoryDuelCompletion.mockRejectedValue(new Error("red caída"));
    const { result } = renderHook(() => useStoryDuelResultSync(SYNC_INPUT));

    await act(async () => { await result.current.handleMatchResolved(WIN_RESULT); });
    await act(async () => { await result.current.handleResultAction(); });

    expect(replace.mock.calls[0][0]).toContain("outcome=WON");
  });

  it("ignora pulsaciones repetidas del botón de retorno", async () => {
    postStoryDuelCompletion.mockResolvedValue(WIN_PAYLOAD);
    const { result } = renderHook(() => useStoryDuelResultSync(SYNC_INPUT));

    await act(async () => { await result.current.handleMatchResolved(WIN_RESULT); });
    await act(async () => {
      await Promise.all([result.current.handleResultAction(), result.current.handleResultAction()]);
    });

    expect(replace).toHaveBeenCalledTimes(1);
  });
});
