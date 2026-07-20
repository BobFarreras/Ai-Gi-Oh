// src/core/services/progression/player-level.test.ts - Verifica la curva XP→nivel→puntos de Operador (ficha 8).
import { describe, expect, it } from "vitest";
import { cumulativeXpForLevel, resolvePlayerLevel, xpToReachNextLevel } from "./player-level";

describe("resolvePlayerLevel", () => {
  it("XP 0 → nivel 1, sin puntos, 750 al siguiente", () => {
    expect(resolvePlayerLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 750, totalSkillPoints: 0 });
  });

  it("justo por debajo del umbral no sube de nivel (749 → nivel 1)", () => {
    expect(resolvePlayerLevel(749)).toEqual({ level: 1, xpIntoLevel: 749, xpForNext: 750, totalSkillPoints: 0 });
  });

  it("el umbral exacto sube de nivel (750 → nivel 2, 1 punto)", () => {
    expect(resolvePlayerLevel(750)).toEqual({ level: 2, xpIntoLevel: 0, xpForNext: 1150, totalSkillPoints: 1 });
  });

  it("acumula el coste creciente (1900 → nivel 3)", () => {
    // cumulative(3) = 750 + 1150 = 1900; coste 3→4 = 1550.
    expect(resolvePlayerLevel(1900)).toEqual({ level: 3, xpIntoLevel: 0, xpForNext: 1550, totalSkillPoints: 2 });
  });

  it("XP dentro de un nivel reporta el progreso parcial (1899 → nivel 2)", () => {
    expect(resolvePlayerLevel(1899)).toEqual({ level: 2, xpIntoLevel: 1149, xpForNext: 1150, totalSkillPoints: 1 });
  });

  it("el jugador más avanzado de prod (39478 XP) queda en nivel 13 con 12 puntos", () => {
    // cumulative(13) = 35400; cumulative(14) = 40950 → nivel 13.
    expect(resolvePlayerLevel(39478)).toEqual({ level: 13, xpIntoLevel: 4078, xpForNext: 5550, totalSkillPoints: 12 });
  });

  it("XP inválida (negativa / NaN) cae a nivel 1 sin romper", () => {
    expect(resolvePlayerLevel(-500).level).toBe(1);
    expect(resolvePlayerLevel(Number.NaN).level).toBe(1);
  });

  it("es exacto en el borde de cada nivel (cumulative(L) → nivel L)", () => {
    for (let level = 1; level <= 30; level += 1) {
      expect(resolvePlayerLevel(cumulativeXpForLevel(level)).level).toBe(level);
      // Un XP por debajo del umbral pertenece al nivel anterior.
      if (level > 1) expect(resolvePlayerLevel(cumulativeXpForLevel(level) - 1).level).toBe(level - 1);
    }
  });
});

describe("cumulativeXpForLevel / xpToReachNextLevel", () => {
  it("nivel 1 no requiere XP acumulada", () => {
    expect(cumulativeXpForLevel(1)).toBe(0);
  });

  it("la suma acumulada coincide con la suma de costes por nivel", () => {
    let running = 0;
    for (let level = 1; level <= 25; level += 1) {
      expect(cumulativeXpForLevel(level)).toBe(running);
      running += xpToReachNextLevel(level);
    }
  });
});
