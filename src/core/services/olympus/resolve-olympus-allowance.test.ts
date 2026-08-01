// src/core/services/olympus/resolve-olympus-allowance.test.ts - Verifica periodo UTC, arrastre de límite y reset diario.
import { describe, expect, it } from "vitest";
import { IOlympusSettings } from "@/core/entities/olympus/IOlympus";
import { resolveOlympusAllowance, resolveOlympusPeriodKey } from "./resolve-olympus-allowance";

const settings: IOlympusSettings = {
  version: 1,
  dailyAttemptLimit: 3,
  battleTtlMinutes: 45,
  respecFreeAllowance: 1,
  respecCost: 60,
  respecRefundPercent: 75,
};

describe("resolveOlympusAllowance", () => {
  it("deriva el periodo de la fecha UTC, no de la zona local", () => {
    expect(resolveOlympusPeriodKey("2026-07-31T23:30:00.000Z")).toBe("2026-07-31");
    expect(resolveOlympusPeriodKey("2026-08-01T00:10:00.000Z")).toBe("2026-08-01");
  });

  it("entrega el límite completo cuando el jugador no ha jugado hoy", () => {
    expect(resolveOlympusAllowance(settings, null, "2026-07-31T10:00:00.000Z")).toMatchObject({
      periodKey: "2026-07-31",
      attemptsUsed: 0,
      attemptsRemaining: 3,
      nextResetIso: "2026-08-01T00:00:00.000Z",
    });
  });

  it("ignora el uso de un periodo anterior", () => {
    const allowance = resolveOlympusAllowance(
      settings,
      { periodKey: "2026-07-30", attemptsUsed: 3, dailyLimit: 3 },
      "2026-07-31T10:00:00.000Z",
    );
    expect(allowance).toMatchObject({ attemptsUsed: 0, attemptsRemaining: 3 });
  });

  it("respeta el límite ya fijado en el periodo aunque cambie la configuración", () => {
    const allowance = resolveOlympusAllowance(
      { ...settings, dailyAttemptLimit: 1 },
      { periodKey: "2026-07-31", attemptsUsed: 2, dailyLimit: 5 },
      "2026-07-31T10:00:00.000Z",
    );
    expect(allowance).toMatchObject({ dailyLimit: 5, attemptsRemaining: 3 });
  });

  it("nunca devuelve intentos negativos", () => {
    const allowance = resolveOlympusAllowance(
      settings,
      { periodKey: "2026-07-31", attemptsUsed: 9, dailyLimit: 3 },
      "2026-07-31T10:00:00.000Z",
    );
    expect(allowance.attemptsRemaining).toBe(0);
  });
});
