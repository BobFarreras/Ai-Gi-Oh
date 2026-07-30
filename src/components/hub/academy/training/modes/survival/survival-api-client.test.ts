// src/components/hub/academy/training/modes/survival/survival-api-client.test.ts - Verifica contrato HTTP y restauración determinista del snapshot.
import { afterEach, describe, expect, it, vi } from "vitest";
import { issueSurvivalBattle } from "./survival-api-client";

afterEach(() => vi.unstubAllGlobals());

describe("issueSurvivalBattle", () => {
  it("restaura la fábrica de ids usando la seed firmada de sesión", async () => {
    const initialState = {
      playerA: { id: "p1" },
      playerB: { id: "p2" },
      combatLog: [],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      battle: { battleId: "battle-1" },
      session: { id: "session-1", battleId: "battle-1", seed: "seed-1" },
      initialState,
      completionTicket: "ticket",
    }), { status: 200 })));

    const runtime = await issueSurvivalBattle("run-1");

    expect(fetch).toHaveBeenCalledWith("/api/survival/battles/issue", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ runId: "run-1" }),
    }));
    expect(runtime.initialState.idFactory).toBeTypeOf("object");
  });
});
