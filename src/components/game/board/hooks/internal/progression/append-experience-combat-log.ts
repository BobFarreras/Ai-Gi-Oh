// src/components/game/board/hooks/internal/progression/append-experience-combat-log.ts - Añade al combatLog los eventos de EXP y subida de nivel tras persistencia batch.
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { GameState } from "@/core/use-cases/GameEngine";
import { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";

export function appendExperienceSummaryToCombatLog(
  state: GameState,
  actorPlayerId: string,
  summary: IAppliedCardExperienceResult[],
): GameState {
  let nextState = state;
  for (const entry of summary) {
    nextState = appendCombatLogEvent(nextState, actorPlayerId, "CARD_XP_GAINED", {
      cardId: entry.cardId,
      amount: entry.gainedXp,
      oldLevel: entry.oldLevel,
      newLevel: entry.newLevel,
    });
    if (entry.newLevel > entry.oldLevel) {
      nextState = appendCombatLogEvent(nextState, actorPlayerId, "CARD_LEVEL_UP", {
        cardId: entry.cardId,
        oldLevel: entry.oldLevel,
        newLevel: entry.newLevel,
      });
    }
  }
  return nextState;
}

