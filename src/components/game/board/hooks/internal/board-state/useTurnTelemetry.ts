// src/components/game/board/hooks/internal/board-state/useTurnTelemetry.ts - Provee helpers de telemetría de turno sobre combatLog sin mezclar reglas de fase.
import { useCallback } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";

interface IUseTurnTelemetryParams {
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

type TurnTelemetryEvent = "AUTO_PHASE_ADVANCED" | "TURN_GUARD_SHOWN" | "TURN_GUARD_CONFIRMED" | "TURN_GUARD_CANCELLED";

export function useTurnTelemetry({ applyTransition }: IUseTurnTelemetryParams) {
  const appendTelemetry = useCallback(
    (eventType: TurnTelemetryEvent, payload: Record<string, unknown> = {}) => {
      applyTransition((state) => appendCombatLogEvent(state, state.playerA.id, eventType, payload));
    },
    [applyTransition],
  );

  return {
    logAutoPhaseAdvanced: () => appendTelemetry("AUTO_PHASE_ADVANCED"),
    logTurnGuardShown: (warning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS") => appendTelemetry("TURN_GUARD_SHOWN", { warning }),
    logTurnGuardConfirmed: () => appendTelemetry("TURN_GUARD_CONFIRMED"),
    logTurnGuardCancelled: () => appendTelemetry("TURN_GUARD_CANCELLED"),
  };
}
