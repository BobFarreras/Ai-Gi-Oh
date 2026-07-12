// src/core/services/progression/reset-schedule.test.ts - Verifica el cálculo de regeneración de misiones (diaria/semanal UTC) y el formato.
import { describe, it, expect } from "vitest";
import {
  formatResetCountdown,
  msUntilDailyReset,
  msUntilWeeklyLeaderboardReset,
  msUntilWeeklyReset,
} from "./reset-schedule";

const HOUR = 3_600_000;
const DAY = 86_400_000;

describe("msUntilDailyReset", () => {
  it("a las 22:00 UTC faltan 2h para medianoche", () => {
    const now = Date.UTC(2026, 5, 25, 22, 0, 0); // jueves 22:00
    expect(msUntilDailyReset(now)).toBe(2 * HOUR);
  });
  it("justo a medianoche faltan 24h (siguiente reset)", () => {
    const now = Date.UTC(2026, 5, 25, 0, 0, 0);
    expect(msUntilDailyReset(now)).toBe(DAY);
  });
});

describe("msUntilWeeklyReset", () => {
  it("el domingo a las 00:00 falta 1 día (lunes)", () => {
    const now = Date.UTC(2026, 5, 28, 0, 0, 0); // 2026-06-28 es domingo
    expect(msUntilWeeklyReset(now)).toBe(DAY);
  });
  it("el lunes a las 00:00 faltan 7 días (próximo lunes)", () => {
    const now = Date.UTC(2026, 5, 22, 0, 0, 0); // 2026-06-22 es lunes
    expect(msUntilWeeklyReset(now)).toBe(7 * DAY);
  });
});

describe("msUntilWeeklyLeaderboardReset", () => {
  it("el domingo a las 21:00 UTC falta 1h (cierre a las 22:00)", () => {
    const now = Date.UTC(2026, 6, 12, 21, 0, 0); // 2026-07-12 es domingo
    expect(msUntilWeeklyLeaderboardReset(now)).toBe(HOUR);
  });
  it("el domingo a las 22:00 UTC faltan 7 días (ya rodó al siguiente domingo)", () => {
    const now = Date.UTC(2026, 6, 12, 22, 0, 0);
    expect(msUntilWeeklyLeaderboardReset(now)).toBe(7 * DAY);
  });
  it("el lunes a las 22:00 UTC faltan 6 días", () => {
    const now = Date.UTC(2026, 6, 13, 22, 0, 0); // lunes
    expect(msUntilWeeklyLeaderboardReset(now)).toBe(6 * DAY);
  });
});

describe("formatResetCountdown", () => {
  it("formatea días, horas y minutos", () => {
    expect(formatResetCountdown(2 * DAY + 3 * HOUR)).toBe("2d 3h");
    expect(formatResetCountdown(5 * HOUR + 12 * 60_000)).toBe("5h 12m");
    expect(formatResetCountdown(8 * 60_000)).toBe("8m");
    expect(formatResetCountdown(0)).toBe("ahora");
  });
});
