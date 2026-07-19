// src/infrastructure/persistence/supabase/privileged-writes.test.ts - Regresión de seguridad: las tablas de
// valor (cartera, colección, progresión) NUNCA se escriben con el cliente de la sesión del jugador.
//
// Contexto: hasta 2026-07-14 se escribían con la sesión, lo que obligaba a darle a `authenticated` permiso de
// UPDATE sobre sus propias filas. Con eso, cualquiera podía ponerse Nexus infinitos, regalarse cartas o subirse
// a nivel 100 con un PATCH directo desde la consola del navegador. Si alguien vuelve a enchufar una escritura al
// cliente de sesión, este test lo caza.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";

const serviceRoleClient = { __role: "service_role" } as unknown as SupabaseClient;
const createSupabaseServiceRoleClient = vi.fn(() => serviceRoleClient);

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client", () => ({
  createSupabaseServiceRoleClient: () => createSupabaseServiceRoleClient(),
}));

const { SupabaseWalletRepository } = await import("./SupabaseWalletRepository");
const { SupabasePlayerCardProgressRepository } = await import("./SupabasePlayerCardProgressRepository");
const { SupabasePlayerProgressRepository } = await import("./SupabasePlayerProgressRepository");

/** Cliente de sesión falso: si alguien intenta ESCRIBIR con él, el test falla. */
function createSessionClientSpy() {
  const forbiddenWrite = (operation: string) => () => {
    throw new Error(`ESCRITURA CON EL CLIENTE DE SESIÓN (${operation}): debe usarse service-role.`);
  };
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: forbiddenWrite("insert"),
      update: forbiddenWrite("update"),
      upsert: forbiddenWrite("upsert"),
    }),
    rpc: forbiddenWrite("rpc"),
  };
  return client as unknown as SupabaseClient;
}

/** Cliente service-role falso que devuelve una fila válida en cualquier escritura. */
function stubServiceRoleWrites(row: Record<string, unknown>) {
  const result = { data: row, error: null };
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
  };
  createSupabaseServiceRoleClient.mockReturnValue({
    from: () => ({ insert: () => chain, update: () => chain, upsert: () => chain, select: () => chain }),
    rpc: () => Promise.resolve({ data: row, error: null }),
  } as unknown as SupabaseClient);
}

beforeEach(() => {
  createSupabaseServiceRoleClient.mockReset();
});

describe("escrituras privilegiadas", () => {
  it("la cartera se acredita con service-role, nunca con la sesión del jugador", async () => {
    stubServiceRoleWrites({ player_id: "p1", nexus: 1500 });
    const repository = new SupabaseWalletRepository(createSessionClientSpy());
    const wallet = await repository.creditNexus("p1", 500);
    expect(wallet.nexus).toBe(1500);
    expect(createSupabaseServiceRoleClient).toHaveBeenCalled();
  });

  it("la cartera se debita con service-role, nunca con la sesión del jugador", async () => {
    stubServiceRoleWrites({ player_id: "p1", nexus: 500 });
    const repository = new SupabaseWalletRepository(createSessionClientSpy());
    const wallet = await repository.debitNexus("p1", 500);
    expect(wallet.nexus).toBe(500);
  });

  it("la progresión de carta se guarda con service-role, nunca con la sesión del jugador", async () => {
    stubServiceRoleWrites({
      player_id: "p1", card_id: "entity-x", version_tier: 0, level: 12, xp: 2000,
      mastery_passive_skill_id: null, updated_at: "2026-07-14T00:00:00.000Z",
    });
    const repository = new SupabasePlayerCardProgressRepository(createSessionClientSpy());
    const progress = await repository.upsert({ playerId: "p1", cardId: "entity-x", level: 12, xp: 2000 });
    expect(progress.level).toBe(12);
    expect(createSupabaseServiceRoleClient).toHaveBeenCalled();
  });

  it("la XP/progreso global se ACTUALIZA con service-role, nunca con la sesión (ficha 8: puntos del árbol)", async () => {
    stubServiceRoleWrites({
      player_id: "p1", has_completed_tutorial: true, has_seen_academy_intro: true, has_skipped_tutorial: false,
      medals: 3, story_chapter: 2, player_experience: 5000, updated_at: "2026-07-18T00:00:00.000Z",
    });
    const repository = new SupabasePlayerProgressRepository(createSessionClientSpy());
    const progress = await repository.update({ playerId: "p1", playerExperience: 5000 });
    expect(progress.playerExperience).toBe(5000);
    expect(createSupabaseServiceRoleClient).toHaveBeenCalled();
  });

  it("el progreso global se CREA con service-role, nunca con la sesión del jugador", async () => {
    stubServiceRoleWrites({
      player_id: "p1", has_completed_tutorial: false, has_seen_academy_intro: false, has_skipped_tutorial: false,
      medals: 0, story_chapter: 1, player_experience: 0, updated_at: "2026-07-18T00:00:00.000Z",
    });
    const repository = new SupabasePlayerProgressRepository(createSessionClientSpy());
    const progress = await repository.create({
      playerId: "p1", hasCompletedTutorial: false, medals: 0, storyChapter: 1, playerExperience: 0,
      updatedAtIso: "2026-07-18T00:00:00.000Z",
    });
    expect(progress.playerId).toBe("p1");
    expect(createSupabaseServiceRoleClient).toHaveBeenCalled();
  });
});
