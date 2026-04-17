// src/infrastructure/persistence/supabase/SupabaseWalletRepository.test.ts - Verifica uso de RPC atómica y fallback legacy en wallet de Supabase.
import { describe, expect, it, vi } from "vitest";
import { SupabaseWalletRepository } from "@/infrastructure/persistence/supabase/SupabaseWalletRepository";
import { ValidationError } from "@/core/errors/ValidationError";

function createClientMock(options: {
  rpcResult: { data: unknown; error: { code?: string; message?: string } | null };
  selectResult?: { data: { player_id: string; nexus: number } | null; error: { code?: string; message?: string } | null };
  updateResult?: { data: { player_id: string; nexus: number } | null; error: { code?: string; message?: string } | null };
}) {
  const singleMock = vi.fn().mockResolvedValue(options.updateResult ?? { data: null, error: null });
  const selectSingleMock = vi.fn().mockResolvedValue(options.selectResult ?? { data: { player_id: "player-1", nexus: 1000 }, error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: singleMock }) }) });
  const selectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: selectSingleMock }) });
  const fromMock = vi.fn().mockReturnValue({ select: selectMock, update: updateMock });
  const rpcMock = vi.fn().mockResolvedValue(options.rpcResult);
  return {
    client: { rpc: rpcMock, from: fromMock } as never,
    rpcMock,
    fromMock,
  };
}

describe("SupabaseWalletRepository", () => {
  it("usa la RPC atómica de débito cuando está disponible", async () => {
    const { client, rpcMock, fromMock } = createClientMock({
      rpcResult: { data: [{ player_id: "player-1", nexus: 850 }], error: null },
    });
    const repository = new SupabaseWalletRepository(client);
    const result = await repository.debitNexus("player-1", 150);
    expect(result).toEqual({ playerId: "player-1", nexus: 850 });
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("cae a fallback legacy cuando la RPC no existe", async () => {
    const { client } = createClientMock({
      rpcResult: { data: null, error: { code: "42883", message: "function wallet_debit_nexus does not exist" } },
      selectResult: { data: { player_id: "player-1", nexus: 1000 }, error: null },
      updateResult: { data: { player_id: "player-1", nexus: 900 }, error: null },
    });
    const repository = new SupabaseWalletRepository(client);
    const result = await repository.debitNexus("player-1", 100);
    expect(result).toEqual({ playerId: "player-1", nexus: 900 });
  });

  it("propaga error de saldo insuficiente cuando la RPC lo reporta", async () => {
    const { client } = createClientMock({
      rpcResult: { data: null, error: { code: "P0001", message: "Saldo Nexus insuficiente para completar el débito." } },
    });
    const repository = new SupabaseWalletRepository(client);
    await expect(repository.debitNexus("player-1", 2000)).rejects.toBeInstanceOf(ValidationError);
  });
});
