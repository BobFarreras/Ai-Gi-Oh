// src/components/game/board/hooks/internal/board-state/useAdvancePhaseGuard.ts - Encapsula confirmaciones de avance de fase y preferencia de ayuda persistente.
import { useCallback, useState } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { resolveAdvanceWarning } from "./turn-guard";

interface IUseAdvancePhaseGuardParams {
  gameState: GameState;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  isTurnHelpEnabled: boolean;
  assertPlayerTurn: () => boolean;
  executeAdvancePhase: () => void;
  disableTurnHelp: () => void;
  onGuardShown: (warning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS") => void;
  onGuardConfirmed: () => void;
  onGuardCancelled: () => void;
}

export function useAdvancePhaseGuard({
  gameState,
  winnerPlayerId,
  isAnimating,
  isTurnHelpEnabled,
  assertPlayerTurn,
  executeAdvancePhase,
  disableTurnHelp,
  onGuardShown,
  onGuardConfirmed,
  onGuardCancelled,
}: IUseAdvancePhaseGuardParams) {
  const [pendingAdvanceWarning, setPendingAdvanceWarning] = useState<"MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null>(null);
  const advancePhase = useCallback(() => {
    if (winnerPlayerId || isAnimating || !assertPlayerTurn()) return;
    if (!isTurnHelpEnabled) {
      executeAdvancePhase();
      return;
    }
    const warning = resolveAdvanceWarning(gameState);
    if (!warning) {
      executeAdvancePhase();
      return;
    }
    onGuardShown(warning);
    setPendingAdvanceWarning(warning);
  }, [assertPlayerTurn, executeAdvancePhase, gameState, isAnimating, isTurnHelpEnabled, onGuardShown, winnerPlayerId]);
  const confirmAdvancePhase = useCallback(
    (shouldDisableHelp: boolean) => {
      if (shouldDisableHelp) disableTurnHelp();
      onGuardConfirmed();
      setPendingAdvanceWarning(null);
      executeAdvancePhase();
    },
    [disableTurnHelp, executeAdvancePhase, onGuardConfirmed],
  );
  const cancelAdvancePhase = useCallback(() => {
    onGuardCancelled();
    setPendingAdvanceWarning(null);
  }, [onGuardCancelled]);

  return { advancePhase, confirmAdvancePhase, cancelAdvancePhase, pendingAdvanceWarning };
}
