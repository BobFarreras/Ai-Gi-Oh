// src/components/hub/academy/training/modes/olympus/olympus-api-client.test.ts - Verifica el contrato HTTP y la restauración determinista del snapshot.
import { afterEach, describe, expect, it, vi } from "vitest";
import { issueOlympusBattle, purchaseChampionUpgrade, resetOlympusBattle } from "./olympus-api-client";

afterEach(() => vi.unstubAllGlobals());

describe("issueOlympusBattle", () => {
  it("restaura la fábrica de ids usando la seed firmada de sesión", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      battle: { battleId: "battle-1", attemptNumber: 1 },
      champion: { id: "gennvim" },
      legend: { id: "zeus", displayName: "Zeus" },
      resumed: false,
      session: { id: "session-1", battleId: "battle-1", seed: "seed-1" },
      initialState: { playerA: { id: "p1" }, playerB: { id: "zeus" }, combatLog: [] },
      completionTicket: "ticket",
      presentation: { championName: "GenNvim", legendName: "Zeus", specialRules: [] },
      aiProfile: "MYTHIC",
      journalEntries: [],
    }), { status: 200 })));

    const runtime = await issueOlympusBattle("gennvim", "zeus");

    expect(fetch).toHaveBeenCalledWith("/api/olympus/battles/issue", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ championId: "gennvim", opponentId: "zeus" }),
    }));
    // Sin la fábrica reconstruida el Board generaría ids distintos a los que reproduce el servidor.
    expect(runtime.initialState.idFactory).toBeTypeOf("object");
    expect(runtime.aiProfile).toBe("MYTHIC");
  });

  it("propaga el motivo real que devuelve el servidor", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ code: "VALIDATION_ERROR", message: "Debes derrotar a ese rival en su nivel antes de usarlo en Olimpo." }),
      { status: 400 },
    )));

    await expect(issueOlympusBattle("guill", "zeus")).rejects.toThrow(/derrotar a ese rival/i);
  });

  it("traduce el 429 a un mensaje accionable en vez del genérico", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429 })));
    await expect(purchaseChampionUpgrade("gennvim", "gennvim-power-1")).rejects.toThrow(/Espera unos segundos/i);
  });
});

describe("resetOlympusBattle", () => {
  it("solicita el cierre autoritativo de la batalla bloqueada", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ forfeited: true }), { status: 200 })));

    await expect(resetOlympusBattle()).resolves.toEqual({ forfeited: true });
    expect(fetch).toHaveBeenCalledWith("/api/olympus/battles/reset", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({}),
    }));
  });
});
