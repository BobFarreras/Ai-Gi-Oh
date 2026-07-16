// src/components/hub/home/objects/ArsenalObjectHistoryDialog.test.tsx - Formato de las líneas del historial de
// objetos aplicados (ficha 9b): efecto por tipo de objeto y fecha legible.
import { describe, expect, it } from "vitest";
import { formatUpgradeHistoryDate, formatUpgradeHistoryEffect } from "./ArsenalObjectHistoryDialog";

describe("formatUpgradeHistoryEffect", () => {
  it("las mejoras muestran el bonus y el stat", () => {
    expect(formatUpgradeHistoryEffect({ itemType: "CARD_UPGRADE", stat: "ATTACK", value: 100 })).toBe("+100 ATK");
    expect(formatUpgradeHistoryEffect({ itemType: "CARD_UPGRADE", stat: "DEFENSE", value: 100 })).toBe("+100 DEF");
  });

  it("los caramelos muestran el nivel alcanzado (value = nivel, no bonus)", () => {
    expect(formatUpgradeHistoryEffect({ itemType: "LEVEL_CANDY", stat: null, value: 7 })).toBe("Nivel 7");
  });
});

describe("formatUpgradeHistoryDate", () => {
  it("formatea la fecha en es-ES con hora", () => {
    const formatted = formatUpgradeHistoryDate("2026-07-16T18:30:00.000Z");
    // No se fija la zona horaria del runner: basta con que salga día/mes/año y una hora.
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{2}/);
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it("una fecha inválida no revienta el render (cadena vacía)", () => {
    expect(formatUpgradeHistoryDate("no-es-una-fecha")).toBe("");
  });
});
