// src/services/story/overworld/overworld-persistence-client.test.ts - Tests del cliente de persistencia de eventos del overworld.
import { afterEach, describe, expect, it, vi } from "vitest";
import { markOverworldEventInteracted } from "./overworld-persistence-client";

describe("markOverworldEventInteracted", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envía el nodeId al endpoint de mark-interacted con credenciales", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await markOverworldEventInteracted("story-a1-event-special-card-signal");

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/story/overworld/mark-interacted");
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      nodeId: "story-a1-event-special-card-signal",
    });
  });

  it("devuelve false si el servidor responde con error (sin lanzar)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));

    await expect(markOverworldEventInteracted("story-a1-event-echo")).resolves.toBe(false);
  });

  it("devuelve false si la red falla (sin lanzar)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(markOverworldEventInteracted("story-a1-event-echo")).resolves.toBe(false);
  });
});
