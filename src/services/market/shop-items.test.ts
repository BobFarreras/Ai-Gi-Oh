// src/services/market/shop-items.test.ts - Frontera de la tienda de objetos: el precio/valor y el catálogo los
// pone el servidor; el cliente solo elige qué comprar o aplicar.
import { describe, expect, it, vi, beforeEach } from "vitest";

const getCurrentUserSession = vi.fn();
const rpc = vi.fn();
const tableData: Record<string, unknown[]> = { level_candies: [], card_upgrade_items: [], player_inventory_items: [] };

vi.mock("@/services/auth/get-current-user-session", () => ({
  getCurrentUserSession: () => getCurrentUserSession(),
}));

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-server-client", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => Promise.resolve({ data: tableData[table] ?? [] }),
        then: (resolve: (value: { data: unknown[] }) => unknown) => resolve({ data: tableData[table] ?? [] }),
      };
      return builder;
    },
    rpc: (name: string, args: Record<string, unknown>) => rpc(name, args),
  }),
}));

const { getShopItems, buyCandy, buyUpgradeItem, applyUpgradeItem } = await import("./shop-items");

const OPERATION_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

beforeEach(() => {
  getCurrentUserSession.mockReset();
  rpc.mockReset();
  getCurrentUserSession.mockResolvedValue({ user: { id: "p1" } });
  rpc.mockResolvedValue({ data: 4200, error: null });
  tableData.level_candies = [{ id: "candy-usb-raro-2", name: "USB Raro +2", levels: 2, price_nexus: 3500, image_url: "/x.webp" }];
  tableData.card_upgrade_items = [{ id: "item-nucleo-overclock", name: "Núcleo Overclock", stat: "ATTACK", value: 100, price_nexus: 2000, image_url: "/y.webp" }];
  tableData.player_inventory_items = [{ item_id: "candy-usb-raro-2", quantity: 3 }, { item_id: "item-nucleo-overclock", quantity: 1 }];
});

describe("getShopItems", () => {
  it("devuelve caramelos y mejoras con lo que ya posee el jugador", async () => {
    const items = await getShopItems();
    expect(items.candies[0]).toMatchObject({ id: "candy-usb-raro-2", owned: 3 });
    expect(items.upgrades[0]).toMatchObject({ id: "item-nucleo-overclock", stat: "ATTACK", value: 100, owned: 1 });
  });

  it("sin sesión no hay tienda", async () => {
    getCurrentUserSession.mockResolvedValue(null);
    expect(await getShopItems()).toEqual({ candies: [], upgrades: [] });
  });
});

describe("compra y aplicación de objetos", () => {
  it("el caramelo se compra por su RPC y devuelve el saldo resultante", async () => {
    const result = await buyCandy("candy-usb-raro-2", OPERATION_ID);
    expect(rpc).toHaveBeenCalledWith("buy_level_candy", { p_candy_id: "candy-usb-raro-2", p_operation_id: OPERATION_ID });
    expect(result.nexus).toBe(4200);
  });

  it("la mejora se compra por su RPC propia", async () => {
    await buyUpgradeItem("item-nucleo-overclock", OPERATION_ID);
    expect(rpc).toHaveBeenCalledWith("buy_card_upgrade_item", { p_item_id: "item-nucleo-overclock", p_operation_id: OPERATION_ID });
  });

  it("aplicar una mejora pasa por la RPC transaccional (el tope lo valida la BD)", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await applyUpgradeItem("item-nucleo-overclock", "entity-x", OPERATION_ID);
    expect(rpc).toHaveBeenCalledWith("apply_card_upgrade", { p_item_id: "item-nucleo-overclock", p_card_id: "entity-x", p_operation_id: OPERATION_ID });
  });

  it("exige clave de operación válida (impide el doble gasto)", async () => {
    await expect(buyCandy("candy-usb-raro-2", "no-uuid")).rejects.toThrow(/operación/i);
    await expect(applyUpgradeItem("item-nucleo-overclock", "entity-x", "no-uuid")).rejects.toThrow(/operación/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("propaga el error de la transacción (saldo insuficiente, tope alcanzado…)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "No tienes suficientes Nexus." } });
    await expect(buyUpgradeItem("item-nucleo-overclock", OPERATION_ID)).rejects.toThrow(/Nexus/i);
  });
});
