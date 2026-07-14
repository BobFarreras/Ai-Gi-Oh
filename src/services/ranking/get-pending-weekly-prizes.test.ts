// src/services/ranking/get-pending-weekly-prizes.test.ts - El aviso solo lista premios REALES del jugador de
// la sesión y no puede tumbar el hub si la consulta falla.
import { describe, expect, it, vi, beforeEach } from "vitest";

const getCurrentUserSession = vi.fn();
const queryResult = { data: null as unknown, error: null as unknown };
const filters: Record<string, unknown> = {};

vi.mock("@/services/auth/get-current-user-session", () => ({
  getCurrentUserSession: () => getCurrentUserSession(),
}));

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-server-client", () => ({
  createSupabaseServerClient: async () => ({
    from: () => {
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => { filters[column] = value; return builder; },
        is: (column: string, value: unknown) => { filters[column] = value; return builder; },
        gt: (column: string, value: unknown) => { filters[`${column}_gt`] = value; return builder; },
        order: () => Promise.resolve(queryResult),
      };
      return builder;
    },
  }),
}));

const { getPendingWeeklyPrizes } = await import("./get-pending-weekly-prizes");

beforeEach(() => {
  getCurrentUserSession.mockReset();
  for (const key of Object.keys(filters)) delete filters[key];
  queryResult.data = null;
  queryResult.error = null;
  getCurrentUserSession.mockResolvedValue({ user: { id: "p1" } });
});

describe("getPendingWeeklyPrizes", () => {
  it("no devuelve nada sin sesión", async () => {
    getCurrentUserSession.mockResolvedValue(null);
    expect(await getPendingWeeklyPrizes()).toEqual([]);
  });

  it("consulta solo los premios del jugador, sin avisar y con Nexus", async () => {
    queryResult.data = [];
    await getPendingWeeklyPrizes();
    expect(filters.player_id).toBe("p1");
    expect(filters.seen_at).toBeNull();
    expect(filters.awarded_nexus_gt).toBe(0);
  });

  it("mapea las filas del historial al premio del diálogo", async () => {
    queryResult.data = [
      { id: 7, week_key: "2026-W28", board: "ACTIVITY", final_rank: 1, points: 320, awarded_nexus: 1000 },
      { id: 9, week_key: "2026-W28", board: "COMMERCIAL", final_rank: 3, points: 150, awarded_nexus: 400 },
    ];
    expect(await getPendingWeeklyPrizes()).toEqual([
      { id: 7, weekKey: "2026-W28", board: "ACTIVITY", finalRank: 1, points: 320, awardedNexus: 1000 },
      { id: 9, weekKey: "2026-W28", board: "COMMERCIAL", finalRank: 3, points: 150, awardedNexus: 400 },
    ]);
  });

  it("si la consulta falla devuelve vacío: sin aviso, pero el hub sigue en pie (los Nexus ya están cobrados)", async () => {
    queryResult.error = { message: "boom" };
    expect(await getPendingWeeklyPrizes()).toEqual([]);
  });
});
