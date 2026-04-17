// src/infrastructure/persistence/supabase/SupabaseTutorialRewardClaimRepository.test.ts - Verifica fallback y parseo robusto del claim final tutorial en Supabase.
import { describe, expect, it, vi } from "vitest";
import { SupabaseTutorialRewardClaimRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialRewardClaimRepository";

function createClientMock(options: {
  tutorialRpc: { data: unknown; error: { code?: string; message?: string } | null };
  walletRpc?: { data: unknown; error: { code?: string; message?: string } | null };
  insertError?: { code?: string; message?: string } | null;
}) {
  const insertMock = vi.fn().mockResolvedValue({ error: options.insertError ?? null });
  const fromMock = vi.fn().mockImplementation((table: string) => {
    if (table === "player_tutorial_reward_claims") return { insert: insertMock };
    throw new Error(`Tabla no mockeada: ${table}`);
  });
  const rpcMock = vi.fn().mockImplementation((fn: string) => {
    if (fn === "tutorial_claim_final_reward_nexus") return Promise.resolve(options.tutorialRpc);
    if (fn === "wallet_credit_nexus") {
      return Promise.resolve(
        options.walletRpc ?? { data: [{ player_id: "p1", nexus: 1600 }], error: null },
      );
    }
    throw new Error(`RPC no mockeada: ${fn}`);
  });
  return { client: { rpc: rpcMock, from: fromMock } as never, fromMock, insertMock };
}

describe("SupabaseTutorialRewardClaimRepository", () => {
  it("acepta respuesta RPC atómica en formato objeto", async () => {
    const { client } = createClientMock({
      tutorialRpc: { data: { applied: true }, error: null },
    });
    const repository = new SupabaseTutorialRewardClaimRepository(client);
    await expect(repository.tryClaimAndApplyNexusReward("p1", 600)).resolves.toBe(true);
  });

  it("usa fallback cuando RPC atómica falla por permisos/contexto", async () => {
    const { client, insertMock } = createClientMock({
      tutorialRpc: { data: null, error: { code: "42501", message: "No autorizado para reclamar esta recompensa tutorial." } },
      walletRpc: { data: [{ player_id: "p1", nexus: 1600 }], error: null },
    });
    const repository = new SupabaseTutorialRewardClaimRepository(client);
    await expect(repository.tryClaimAndApplyNexusReward("p1", 600)).resolves.toBe(true);
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
