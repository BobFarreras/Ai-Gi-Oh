// src/components/game/board/hooks/internal/progression/append-experience-combat-log.test.ts - Pruebas de inserción de eventos de EXP/level up en combatLog al cierre del duelo.
import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { appendExperienceSummaryToCombatLog } from "./append-experience-combat-log";

describe("append-experience-combat-log", () => {
  it("añade evento de EXP y level up cuando aplica", () => {
    const state = createInitialGameState({
      playerA: { id: "p1", name: "A", deck: [] },
      playerB: { id: "p2", name: "B", deck: [] },
    });
    const next = appendExperienceSummaryToCombatLog(state, "p1", [
      {
        cardId: "entity-python",
        gainedXp: 40,
        oldLevel: 0,
        newLevel: 1,
        progress: {
          playerId: "p1",
          cardId: "entity-python",
          versionTier: 0,
          level: 1,
          xp: 1040,
          masteryPassiveSkillId: null,
          updatedAtIso: new Date().toISOString(),
        },
      },
    ]);
    const eventTypes = next.combatLog.slice(-2).map((event) => event.eventType);
    expect(eventTypes).toEqual(["CARD_XP_GAINED", "CARD_LEVEL_UP"]);
  });
});

