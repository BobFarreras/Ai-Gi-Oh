// src/components/game/board/hooks/internal/match/useMatchProgression.ts - Gestiona la persistencia y proyección de experiencia de cartas al terminar el duelo.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { GameState } from "@/core/use-cases/GameEngine";
import { appendExperienceSummaryToCombatLog } from "../progression/append-experience-combat-log";
import { buildCardExperienceEvents } from "../progression/build-card-experience-events";
import { buildPlayerCardLookup } from "../progression/build-player-card-lookup";
import { buildProjectedExperienceSummary } from "../progression/build-projected-experience-summary";
import { IBoardUiError } from "../boardError";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { createMatchProgressionService } from "@/services/game/match/progression";
import { buildPlayerOwnedCardIds } from "../progression/build-player-owned-card-ids";

function createBattleExperienceBatchId(): string {
  return `battle-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface IUseMatchProgressionParams {
  mode: IMatchMode;
  gameState: GameState;
  winnerPlayerId: string | "DRAW" | null;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  setLastError: (value: IBoardUiError | null) => void;
}

export function useMatchProgression({ mode, gameState, winnerPlayerId, applyTransition, setLastError }: IUseMatchProgressionParams) {
  const [battleExperienceSummary, setBattleExperienceSummary] = useState<IAppliedCardExperienceResult[]>([]);
  const [isBattleExperiencePending, setIsBattleExperiencePending] = useState(false);
  const [battleId, setBattleId] = useState<string>(() => createBattleExperienceBatchId());
  const battleExperienceCardLookup = useMemo(() => buildPlayerCardLookup(gameState.playerA), [gameState.playerA]);
  const progressionService = useMemo(() => createMatchProgressionService(mode), [mode]);
  const hasAppliedBattleExperienceRef = useRef(false);
  // La propiedad se congela antes de que robos o cambios de zona mezclen cartas propias y ajenas.
  const ownedCardIdsRef = useRef<ReadonlySet<string>>(buildPlayerOwnedCardIds(gameState.playerA));

  const resetBattleProgression = useCallback(() => {
    setBattleExperienceSummary([]);
    setIsBattleExperiencePending(false);
    setBattleId(createBattleExperienceBatchId());
    hasAppliedBattleExperienceRef.current = false;
  }, []);

  useEffect(() => {
    if (!winnerPlayerId) {
      hasAppliedBattleExperienceRef.current = false;
      return;
    }
    if (hasAppliedBattleExperienceRef.current) return;
    hasAppliedBattleExperienceRef.current = true;
    Promise.resolve().then(() => setIsBattleExperiencePending(true));
    const experienceEvents = buildCardExperienceEvents(gameState.combatLog, gameState.playerA.id, ownedCardIdsRef.current);
    const projectedSummary = buildProjectedExperienceSummary(gameState.playerA.id, battleExperienceCardLookup, experienceEvents);

    progressionService
      .applyBattleCardExperience(battleId, experienceEvents)
      .then((summary) => {
        const resolvedSummary = summary.length > 0 ? summary : projectedSummary;
        setBattleExperienceSummary(resolvedSummary);
        if (resolvedSummary.length === 0) return;
        applyTransition((currentState) => appendExperienceSummaryToCombatLog(currentState, currentState.playerA.id, resolvedSummary));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "No se pudo guardar la experiencia de cartas del duelo.";
        setLastError({ code: "VALIDATION_ERROR", message });
        setBattleExperienceSummary(projectedSummary);
        if (projectedSummary.length > 0) {
          applyTransition((currentState) => appendExperienceSummaryToCombatLog(currentState, currentState.playerA.id, projectedSummary));
        }
      })
      .finally(() => {
        setIsBattleExperiencePending(false);
      });
  }, [applyTransition, battleExperienceCardLookup, battleId, gameState.combatLog, gameState.playerA.id, progressionService, setLastError, winnerPlayerId]);

  return {
    battleExperienceSummary,
    battleExperienceCardLookup: battleExperienceCardLookup as Record<string, ICard>,
    isBattleExperiencePending,
    resetBattleProgression,
  };
}
