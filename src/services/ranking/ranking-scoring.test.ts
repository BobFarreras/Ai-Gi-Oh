// src/services/ranking/ranking-scoring.test.ts - Blinda las reglas de puntuación mostradas al jugador
// contra deriva respecto a weekly_leaderboard_point_rules (migración 094).
import { describe, expect, it } from "vitest";
import { RANKING_SCORING_GUIDES, RANKING_SCORING_ORDER } from "./ranking-scoring";

describe("ranking-scoring", () => {
  it("cubre los tres tableros en orden canónico", () => {
    expect(RANKING_SCORING_ORDER).toEqual(["MULTIPLAYER", "ACTIVITY", "COMMERCIAL"]);
    for (const boardId of RANKING_SCORING_ORDER) {
      expect(RANKING_SCORING_GUIDES[boardId].boardId).toBe(boardId);
    }
  });

  it("refleja los puntos de ACTIVITY de la migración 094 (+20 juego, +15 claim)", () => {
    const rules = RANKING_SCORING_GUIDES.ACTIVITY.rules;
    expect(rules.filter((rule) => rule.points === "+20")).toHaveLength(3);
    expect(rules.some((rule) => rule.points === "+15")).toBe(true);
  });

  it("refleja los puntos de COMMERCIAL (+10 carta, +30 pack, +20 evolución)", () => {
    const points = RANKING_SCORING_GUIDES.COMMERCIAL.rules.map((rule) => rule.points).sort();
    expect(points).toEqual(["+10", "+20", "+30"]);
  });

  it("los tableros semanales llevan nota de cierre y premios; el ELO no", () => {
    expect(RANKING_SCORING_GUIDES.ACTIVITY.prizes).toBeTruthy();
    expect(RANKING_SCORING_GUIDES.COMMERCIAL.resetNote).toBeTruthy();
    expect(RANKING_SCORING_GUIDES.MULTIPLAYER.prizes).toBeUndefined();
  });
});
