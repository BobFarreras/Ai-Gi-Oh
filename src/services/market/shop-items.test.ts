// src/services/market/shop-items.test.ts - Frontera de la tienda de objetos: el precio y el catálogo los pone
// el servidor; el cliente solo elige qué comprar.
import { describe, expect, it, vi, beforeEach } from "vitest";

const getCurrentUserSession = vi.fn();
const rpc = vi.fn();
const tableData: Record<string, unknown[]> = { level_candies: [], player_inventory_items: [] };

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

const { getShopItems, buyShopItem } = await import("./shop-items");

const OPERATION_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

beforeEach(() => {
  getCurrentUserSession.mockReset();
  rpc.mockReset();
  getCurrentUserSession.mockResolvedValue({ user: { id: "p1" } });
  rpc.mockResolvedValue({ data: 4200, error: null });
  tableData.level_candies = [
    { id: "candy-usb-raro-2", name: "USB Raro +2", levels: 2, price_nexus: 3500, image_url: "/assets/items/candy-usb-raro.webp" },
  ];
  tableData.player_inventory_items = [{ item_id: "candy-usb-raro-2", quantity: 3 }];
});

describe("getShopItems", () => {
  it("devuelve el catálogo con la cantidad que ya posee el jugador", async () => {
    const items = await getShopItems();
    expect(items).toEqual([
      { id: "candy-usb-raro-2", name: "USB Raro +2", levels: 2, priceNexus: 3500, imageUrl: "/assets/items/candy-usb-raro.webp", owned: 3 },
    ]);
  });

  it("sin sesión no hay tienda", async () => {
    getCurrentUserSession.mockResolvedValue(null);
    expect(await getShopItems()).toEqual([]);
  });
});

describe("buyShopItem", () => {
  it("compra por RPC transaccional y devuelve el saldo resultante (no lo calcula el cliente)", async () => {
    const result = await buyShopItem("candy-usb-raro-2", OPERATION_ID);
    expect(rpc).toHaveBeenCalledWith("buy_level_candy", { p_candy_id: "candy-usb-raro-2", p_operation_id: OPERATION_ID });
    expect(result.nexus).toBe(4200);
  });

  it("exige clave de operación válida: es lo que impide que un doble clic cobre dos veces", async () => {
    await expect(buyShopItem("candy-usb-raro-2", "no-es-uuid")).rejects.toThrow(/operación/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("propaga el error de la transacción (saldo insuficiente, objeto inactivo…)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "No tienes suficientes Nexus." } });
    await expect(buyShopItem("candy-usb-raro-2", OPERATION_ID)).rejects.toThrow(/Nexus/i);
  });
});
