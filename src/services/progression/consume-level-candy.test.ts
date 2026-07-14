// src/services/progression/consume-level-candy.test.ts - Frontera de seguridad del USB Raro: la XP la decide el
// servidor a partir del nivel REAL de la carta, nunca el cliente.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { getTotalXpRequiredToReachLevel } from "@/core/services/progression/card-level-rules";

const getCurrentUserSession = vi.fn();
const rpc = vi.fn();
const tables: Record<string, unknown> = {};

vi.mock("@/services/auth/get-current-user-session", () => ({
  getCurrentUserSession: () => getCurrentUserSession(),
}));

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-server-client", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: () => Promise.resolve({ data: tables[table] ?? null }),
      };
      return builder;
    },
    rpc: (name: string, args: Record<string, unknown>) => rpc(name, args),
  }),
}));

const { consumeLevelCandy } = await import("./consume-level-candy");

const OPERATION_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

beforeEach(() => {
  getCurrentUserSession.mockReset();
  rpc.mockReset();
  getCurrentUserSession.mockResolvedValue({ user: { id: "p1" } });
  rpc.mockResolvedValue({ error: null });
  tables.level_candies = { id: "candy-usb-raro-2", levels: 2, is_active: true };
  tables.player_card_progress = { level: 10, xp: 1375 };
});

describe("consumeLevelCandy", () => {
  it("calcula la XP en el servidor a partir del nivel real de la carta", async () => {
    const result = await consumeLevelCandy({ candyId: "candy-usb-raro-2", cardId: "entity-x", operationId: OPERATION_ID });
    expect(result.oldLevel).toBe(10);
    expect(result.newLevel).toBe(12);
    // Lo que se manda a la BD lo decide el servidor, no el cliente.
    expect(rpc).toHaveBeenCalledWith("consume_level_candy", expect.objectContaining({
      p_candy_id: "candy-usb-raro-2",
      p_card_id: "entity-x",
      p_new_level: 12,
    }));
  });

  it("el mismo caramelo concede MUCHA más XP si la carta está alta", async () => {
    // XP coherente con el nivel 80: el nivel SIEMPRE se deriva de la XP acumulada (fuente de verdad única),
    // así que un fixture con nivel y XP que no cuadran daría el nivel que dice la XP, no el de la fila.
    tables.player_card_progress = { level: 80, xp: getTotalXpRequiredToReachLevel(80) };
    const result = await consumeLevelCandy({ candyId: "candy-usb-raro-2", cardId: "entity-x", operationId: OPERATION_ID });
    expect(result.newLevel).toBe(82);
    expect(result.grantedXp).toBe(4265);
  });

  it("rechaza una carta que ya está al nivel máximo (no se gasta el caramelo)", async () => {
    tables.player_card_progress = { level: 100, xp: 999999 };
    await expect(
      consumeLevelCandy({ candyId: "candy-usb-raro-2", cardId: "entity-x", operationId: OPERATION_ID }),
    ).rejects.toThrow(/nivel máximo/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rechaza un caramelo inexistente o desactivado", async () => {
    tables.level_candies = null;
    await expect(
      consumeLevelCandy({ candyId: "candy-inventado", cardId: "entity-x", operationId: OPERATION_ID }),
    ).rejects.toThrow(/no existe/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("exige una clave de operación válida (es lo que impide el doble gasto)", async () => {
    await expect(
      consumeLevelCandy({ candyId: "candy-usb-raro-2", cardId: "entity-x", operationId: "no-es-uuid" }),
    ).rejects.toThrow(/operación/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sin sesión no se puede consumir", async () => {
    getCurrentUserSession.mockResolvedValue(null);
    await expect(
      consumeLevelCandy({ candyId: "candy-usb-raro-2", cardId: "entity-x", operationId: OPERATION_ID }),
    ).rejects.toThrow(/sesión/i);
  });
});
