// src/core/services/progression/player-level.test.ts - Verifica la curva XP→nivel→puntos de Operador (ficha 8).
import { describe, expect, it } from "vitest";
import { cumulativeXpForLevel, resolvePlayerLevel, xpToReachNextLevel } from "./player-level";

describe("resolvePlayerLevel", () => {
  it("XP 0 → nivel 1, sin puntos, 400 al siguiente", () => {
    expect(resolvePlayerLevel(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNext: 400, totalSkillPoints: 0 });
  });

  it("justo por debajo del umbral no sube de nivel (399 → nivel 1)", () => {
    expect(resolvePlayerLevel(399)).toEqual({ level: 1, xpIntoLevel: 399, xpForNext: 400, totalSkillPoints: 0 });
  });

  it("el umbral exacto sube de nivel (400 → nivel 2, 1 punto)", () => {
    expect(resolvePlayerLevel(400)).toEqual({ level: 2, xpIntoLevel: 0, xpForNext: 600, totalSkillPoints: 1 });
  });

  it("acumula el coste creciente (1000 → nivel 3)", () => {
    // cumulative(3) = 400 + 600 = 1000; coste 3→4 = 800.
    expect(resolvePlayerLevel(1000)).toEqual({ level: 3, xpIntoLevel: 0, xpForNext: 800, totalSkillPoints: 2 });
  });

  it("XP dentro de un nivel reporta el progreso parcial (999 → nivel 2)", () => {
    expect(resolvePlayerLevel(999)).toEqual({ level: 2, xpIntoLevel: 599, xpForNext: 600, totalSkillPoints: 1 });
  });

  it("el jugador más avanzado de prod (39478 XP) queda en nivel 19 con 18 puntos", () => {
    // cumulative(19) = 37800; cumulative(20) = 41800 → nivel 19. No maxea el árbol (~55 pts) → especializa.
    expect(resolvePlayerLevel(39478)).toEqual({ level: 19, xpIntoLevel: 1678, xpForNext: 4000, totalSkillPoints: 18 });
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
