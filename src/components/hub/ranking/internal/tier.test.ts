// src/components/hub/ranking/internal/tier.test.ts - Tests puros de derivación de tiers de podio y ligas por ELO.
import { describe, expect, it } from "vitest";
import {
  getEloLeague,
  getPodiumStyle,
  getPodiumTier,
  getLeagueStyle,
} from "./tier";

describe("getPodiumTier", () => {
  it("devuelve gold para rank 1", () => {
    expect(getPodiumTier(1)).toBe("gold");
  });
  it("devuelve silver para rank 2", () => {
    expect(getPodiumTier(2)).toBe("silver");
  });
  it("devuelve bronze para rank 3", () => {
    expect(getPodiumTier(3)).toBe("bronze");
  });
  it("devuelve null para rank 4+", () => {
    expect(getPodiumTier(4)).toBeNull();
    expect(getPodiumTier(10)).toBeNull();
  });
});

describe("getEloLeague", () => {
  it("ELO < 1200 → bronze", () => {
    expect(getEloLeague(1199)).toBe("bronze");
    expect(getEloLeague(0)).toBe("bronze");
  });
  it("ELO 1200-1399 → bronze (umbral inclusivo inferior)", () => {
    expect(getEloLeague(1200)).toBe("bronze");
    expect(getEloLeague(1399)).toBe("bronze");
  });
  it("ELO 1400-1599 → silver", () => {
    expect(getEloLeague(1400)).toBe("silver");
    expect(getEloLeague(1599)).toBe("silver");
  });
  it("ELO 1600-1799 → gold", () => {
    expect(getEloLeague(1600)).toBe("gold");
    expect(getEloLeague(1799)).toBe("gold");
  });
  it("ELO 1800-1999 → diamond", () => {
    expect(getEloLeague(1800)).toBe("diamond");
    expect(getEloLeague(1999)).toBe("diamond");
  });
  it("ELO 2000+ → master", () => {
    expect(getEloLeague(2000)).toBe("master");
    expect(getEloLeague(2500)).toBe("master");
    expect(getEloLeague(9999)).toBe("master");
  });
});

describe("getPodiumStyle / getLeagueStyle", () => {
  it("cada tier de podio tiene glow, border, text y label", () => {
    for (const tier of ["gold", "silver", "bronze"] as const) {
      const style = getPodiumStyle(tier);
      expect(style.glow).toMatch(/shadow/);
      expect(style.border).toMatch(/border/);
      expect(style.text).toMatch(/^text-/);
      expect(style.label.length).toBeGreaterThan(0);
    }
  });
  it("cada liga tiene glow, border, text y label", () => {
    for (const league of ["bronze", "silver", "gold", "diamond", "master"] as const) {
      const style = getLeagueStyle(league);
      expect(style.glow).toMatch(/shadow/);
      expect(style.border).toMatch(/border/);
      expect(style.text).toMatch(/^text-/);
      expect(style.label.length).toBeGreaterThan(0);
    }
  });
});
