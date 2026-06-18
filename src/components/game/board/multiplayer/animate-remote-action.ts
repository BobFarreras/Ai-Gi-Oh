// src/components/game/board/multiplayer/animate-remote-action.ts - Reproduce la coreografía visual de una acción del rival y luego la aplica al estado.
import { GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { addRevealedId, removeRevealedId } from "@/components/game/board/hooks/internal/trapPreview";
import { sleep } from "@/components/game/board/hooks/internal/sleep";

const TIMINGS = {
  playRevealMs: 950,
  attackWindupMs: 1000,
  postResolutionMs: 850,
  modeChangeMs: 480,
  executionPreviewMs: 1150,
  setRevealMs: 320,
};

export interface IRemoteAnimationContext {
  getState: () => GameState;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  setIsAnimating: (value: boolean) => void;
  setActiveAttackerId: (value: string | null) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
  clearSelection: () => void;
  clearError: () => void;
}

function resolvePlayers(state: GameState, opponentId: string) {
  const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;
  const local = state.playerA.id === opponentId ? state.playerB : state.playerA;
  return { opponent, local };
}

function apply(ctx: IRemoteAnimationContext, opponentId: string, action: IMatchActionPayload): void {
  ctx.applyTransition((state) => {
    try {
      return applyMatchAction(state, opponentId, action);
    } catch {
      return state;
    }
  });
}

/**
 * Aplica una acción del rival reproduciendo su coreografía visual (embestida de
 * ataque, revelado de cartas/efectos) en la pantalla del defensor. Las acciones
 * sin coreografía propia (cambio de fase, fusión —que ya dispara su cinemática
 * por combatLog—, selecciones) se aplican directamente.
 */
export async function animateRemoteAction(
  ctx: IRemoteAnimationContext,
  opponentId: string,
  action: IMatchActionPayload,
): Promise<void> {
  const state = ctx.getState();
  const { opponent, local } = resolvePlayers(state, opponentId);

  switch (action.type) {
    case "ATTACK": {
      const attacker = opponent.activeEntities.find((entity) => entity.instanceId === action.payload.attackerInstanceId);
      const defenderId = action.payload.defenderInstanceId;
      const target = defenderId ? local.activeEntities.find((entity) => entity.instanceId === defenderId) ?? null : null;
      ctx.setIsAnimating(true);
      if (attacker) ctx.setActiveAttackerId(attacker.instanceId);
      if (target && target.mode === "SET") {
        ctx.setRevealedEntities((prev) => addRevealedId(prev, target.instanceId));
        await sleep(TIMINGS.setRevealMs);
      }
      await sleep(TIMINGS.attackWindupMs);
      apply(ctx, opponentId, action);
      await sleep(TIMINGS.postResolutionMs);
      if (target && defenderId) ctx.setRevealedEntities((prev) => removeRevealedId(prev, defenderId));
      ctx.setActiveAttackerId(null);
      ctx.setIsAnimating(false);
      return;
    }

    case "PLAY_CARD":
    case "PLAY_CARD_REPLACE_ENTITY":
    case "PLAY_CARD_REPLACE_ZONE": {
      ctx.setIsAnimating(true);
      await sleep(TIMINGS.playRevealMs);
      apply(ctx, opponentId, action);
      ctx.setIsAnimating(false);
      return;
    }

    case "RESOLVE_EXECUTION": {
      const execution = opponent.activeExecutions.find((entity) => entity.instanceId === action.payload.instanceId);
      ctx.setIsAnimating(true);
      if (execution) ctx.setRevealedEntities((prev) => addRevealedId(prev, execution.instanceId));
      await sleep(TIMINGS.executionPreviewMs);
      apply(ctx, opponentId, action);
      await sleep(TIMINGS.postResolutionMs);
      if (execution) ctx.setRevealedEntities((prev) => removeRevealedId(prev, execution.instanceId));
      ctx.setIsAnimating(false);
      return;
    }

    case "CHANGE_ENTITY_MODE": {
      ctx.setIsAnimating(true);
      ctx.setActiveAttackerId(action.payload.instanceId);
      await sleep(TIMINGS.modeChangeMs);
      apply(ctx, opponentId, action);
      ctx.setActiveAttackerId(null);
      ctx.setIsAnimating(false);
      return;
    }

    // Sin coreografía propia: fusión dispara su cinemática vía combatLog; el resto
    // son transiciones de control que se aplican directamente.
    default:
      apply(ctx, opponentId, action);
  }
}
