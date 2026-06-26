// src/services/progression/record-progression-event.test.ts - Verifica el contrato del emisor de progresión: RPC correcta, no-op vacío, count y resiliencia.
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordProgressionEvent } from "./record-progression-event";

function makeClient(rpc = vi.fn().mockResolvedValue({ data: null, error: null })) {
  return { rpc } as unknown as SupabaseClient & { rpc: ReturnType<typeof vi.fn> };
}

describe("recordProgressionEvent", () => {
  it("llama a record_progression_event con las acciones y count por defecto", async () => {
    const client = makeClient();
    await recordProgressionEvent(client, ["BUY_PACK"]);
    expect(client.rpc).toHaveBeenCalledWith("record_progression_event", { p_action_types: ["BUY_PACK"], p_count: 1 });
  });

  it("propaga varias acciones y un count personalizado", async () => {
    const client = makeClient();
    await recordProgressionEvent(client, ["PLAY_DUEL", "WIN_DUEL"], 3);
    expect(client.rpc).toHaveBeenCalledWith("record_progression_event", { p_action_types: ["PLAY_DUEL", "WIN_DUEL"], p_count: 3 });
  });

  it("no llama a la RPC si no hay acciones", async () => {
    const client = makeClient();
    await recordProgressionEvent(client, []);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("traga errores de la RPC para no romper la acción principal", async () => {
    const client = makeClient(vi.fn().mockRejectedValue(new Error("boom")));
    await expect(recordProgressionEvent(client, ["BUY_CARD"])).resolves.toBeUndefined();
  });
});
