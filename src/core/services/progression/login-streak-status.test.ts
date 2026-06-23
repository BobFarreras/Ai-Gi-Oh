// src/core/services/progression/login-streak-status.test.ts - Tests de la lógica pura de racha de login.
import { describe, expect, it } from "vitest";
import { dayIndexForStreak, resolveLoginStreakView } from "./login-streak-status";

describe("dayIndexForStreak", () => {
  it("mapea la racha al ciclo de 7 días", () => {
    expect(dayIndexForStreak(1)).toBe(1);
    expect(dayIndexForStreak(7)).toBe(7);
    expect(dayIndexForStreak(8)).toBe(1);
    expect(dayIndexForStreak(0)).toBe(1);
  });
});

describe("resolveLoginStreakView", () => {
  it("detecta que ya se reclamó hoy y mantiene el día actual", () => {
    const view = resolveLoginStreakView({ currentStreak: 3, longestStreak: 5, lastClaimDate: "2026-06-23" }, "2026-06-23");
    expect(view.claimedToday).toBe(true);
    expect(view.pendingDayIndex).toBe(3);
  });

  it("continúa la racha si el último claim fue ayer", () => {
    const view = resolveLoginStreakView({ currentStreak: 3, longestStreak: 5, lastClaimDate: "2026-06-22" }, "2026-06-23");
    expect(view.claimedToday).toBe(false);
    expect(view.pendingDayIndex).toBe(4);
  });

  it("reinicia a día 1 si hubo un hueco", () => {
    const view = resolveLoginStreakView({ currentStreak: 6, longestStreak: 6, lastClaimDate: "2026-06-20" }, "2026-06-23");
    expect(view.claimedToday).toBe(false);
    expect(view.pendingDayIndex).toBe(1);
  });

  it("trata al jugador nuevo (sin fecha) como día 1", () => {
    const view = resolveLoginStreakView({ currentStreak: 0, longestStreak: 0, lastClaimDate: null }, "2026-06-23");
    expect(view.claimedToday).toBe(false);
    expect(view.pendingDayIndex).toBe(1);
  });

  it("envuelve correctamente al pasar del día 7 al 1", () => {
    const view = resolveLoginStreakView({ currentStreak: 7, longestStreak: 7, lastClaimDate: "2026-06-22" }, "2026-06-23");
    expect(view.pendingDayIndex).toBe(1);
  });
});
