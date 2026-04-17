// src/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository.test.ts - Verifica resiliencia RPC/fallback en registro de resultado Story.
import { describe, expect, it, vi } from "vitest";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";

function createClientMock(options: {
  rpcResult: { data: unknown; error: { code?: string; message?: string } | null };
  currentRow?: {
    player_id: string;
    duel_id: string;
    wins: number;
    losses: number;
    best_result: "NOT_PLAYED" | "LOST" | "WON";
    first_cleared_at: string | null;
    last_played_at: string | null;
    updated_at: string;
  } | null;
  upsertRow?: {
    player_id: string;
    duel_id: string;
    wins: number;
    losses: number;
    best_result: "NOT_PLAYED" | "LOST" | "WON";
    first_cleared_at: string | null;
    last_played_at: string | null;
    updated_at: string;
  };
}) {
  const maybeSingleMock = vi.fn().mockResolvedValue({ data: options.currentRow ?? null, error: null });
  const selectForGetMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: maybeSingleMock,
      }),
    }),
  });
  const singleUpsertMock = vi.fn().mockResolvedValue({
    data:
      options.upsertRow ?? {
        player_id: "p1",
        duel_id: "story-ch1-duel-1",
        wins: 1,
        losses: 0,
        best_result: "WON",
        first_cleared_at: "2026-04-17T10:00:00.000Z",
        last_played_at: "2026-04-17T10:00:00.000Z",
        updated_at: "2026-04-17T10:00:00.000Z",
      },
    error: null,
  });
  const upsertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: singleUpsertMock,
    }),
  });
  const fromMock = vi.fn().mockReturnValue({
    select: selectForGetMock,
    upsert: upsertMock,
  });
  const rpcMock = vi.fn().mockResolvedValue(options.rpcResult);
  return { client: { rpc: rpcMock, from: fromMock } as never, rpcMock, upsertMock };
}

describe("SupabasePlayerStoryDuelProgressRepository", () => {
  it("acepta respuesta RPC en formato objeto", async () => {
    const { client } = createClientMock({
      rpcResult: {
        data: {
          player_id: "p1",
          duel_id: "story-ch1-duel-1",
          wins: 1,
          losses: 0,
          best_result: "WON",
          first_cleared_at: "2026-04-17T10:00:00.000Z",
          last_played_at: "2026-04-17T10:00:00.000Z",
          updated_at: "2026-04-17T10:00:00.000Z",
        },
        error: null,
      },
    });
    const repository = new SupabasePlayerStoryDuelProgressRepository(client);
    const result = await repository.registerDuelResult("p1", "story-ch1-duel-1", true);
    expect(result.wins).toBe(1);
    expect(result.bestResult).toBe("WON");
  });

  it("usa fallback cuando la RPC falla por permisos/contexto", async () => {
    const { client, upsertMock } = createClientMock({
      rpcResult: {
        data: null,
        error: { code: "42501", message: "No autorizado para registrar este duelo Story." },
      },
      currentRow: null,
    });
    const repository = new SupabasePlayerStoryDuelProgressRepository(client);
    const result = await repository.registerDuelResult("p1", "story-ch1-duel-1", true);
    expect(result.wins).toBe(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });
});
