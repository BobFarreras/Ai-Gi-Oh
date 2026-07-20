// src/components/game/board/multiplayer/animate-remote-action.ts - Reproduce la coreografía visual de una acción del rival y luego la aplica al estado.
import { GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { addRevealedId, removeRevealedId } from "@/components/game/board/hooks/internal/trapPreview";
import { sleep } from "@/components/game/board/hooks/internal/sleep";
import { ITrapActivationDecision, ITrapEligibleOption } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";
import { LocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";

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
  /** La acción del rival no pudo aplicarse aquí: los dos clientes ya no comparten el mismo estado. */
  reportDesync: (action: IMatchActionPayload, error: unknown) => void;
  /** Ficha 4 (multi): pide al DEFENSOR local que elija su trampa reactiva (mismo carrusel que vs IA). */
  requestReactiveTrapDecision: (traps: ITrapEligibleOption[]) => Promise<ITrapActivationDecision>;
  /** Emite la acción del jugador local hacia el rival (para que el atacante converja). */
  emitLocalAction: LocalActionEmitter;
}

function resolvePlayers(state: GameState, opponentId: string) {
  const opponent = state.playerA.id === opponentId ? state.playerA : state.playerB;
  const local = state.playerA.id === opponentId ? state.playerB : state.playerA;
  return { opponent, local };
}

/**
 * Aplica la acción del rival. Si el motor la rechaza aquí, NO es un error recuperable: significa que el
 * estado local ya no coincide con el suyo (p.ej. una instancia que en su tablero existe y en el nuestro no),
 * y a partir de ahora las dos partidas divergen. Dejamos el estado como estaba —aplicar a medias sería peor—
 * pero lo reportamos: tragárselo en silencio hacía que el jugador viera la animación del ataque sin trampas
 * ni pérdida de LP y siguiera jugando una partida distinta a la del rival.
 */
function apply(ctx: IRemoteAnimationContext, opponentId: string, action: IMatchActionPayload): void {
  ctx.applyTransition((state) => {
    try {
      return applyMatchAction(state, opponentId, action);
    } catch (error) {
      ctx.reportDesync(action, error);
      return state;
    }
  });
}

/**
 * Ficha 4 (multi): tras aplicar el ATTACK diferido del rival, el estado queda en pausa apuntando al jugador
 * LOCAL (el defensor). Le mostramos el MISMO carrusel que contra la IA para que elija su trampa reactiva (o
 * pase), aplicamos la decisión localmente y la EMITIMOS como `RESOLVE_REACTIVE_TRAP` para que el atacante
 * converja. La resolución es una acción propia que ambos clientes aplican igual → sin desincronización.
 */
async function maybeResolveLocalReactiveTrap(ctx: IRemoteAnimationContext): Promise<void> {
  const state = ctx.getState();
  const pending = state.pendingReactiveTrapDecision;
  const localPlayerId = state.playerA.id;
  // Solo actuamos en el cliente del DEFENSOR (la pausa le apunta). En el del atacante la pausa apunta al rival.
  if (!pending || pending.defenderPlayerId !== localPlayerId) return;

  // Reunimos las entities elegibles EXACTAS que consideró el motor (por instanceId de la pausa): así el
  // carrusel ofrece justo lo que el motor revalidará al resolver, sin recomputar ni arriesgar drift.
  const eligible: ITrapEligibleOption[] = pending.eligibleTrapInstanceIds
    .map((id) => state.playerA.activeExecutions.find((execution) => execution.instanceId === id))
    .filter((execution): execution is NonNullable<typeof execution> => Boolean(execution))
    .map((execution) => ({ card: execution.card, instanceId: execution.instanceId }));

  const decision = eligible.length > 0 ? await ctx.requestReactiveTrapDecision(eligible) : { activate: false };
  const resolveAction: IMatchActionPayload = {
    type: "RESOLVE_REACTIVE_TRAP",
    payload: { activate: decision.activate, chosenTrapInstanceId: decision.chosenTrapInstanceId },
  };
  // Aplicamos localmente (atribuido al defensor local) ANTES de emitir: si el motor la rechazara, no
  // propagamos una acción que nos desincronizaría. `applyTransition` captura el error y devuelve null.
  const applied = ctx.applyTransition((current) => applyMatchAction(current, localPlayerId, resolveAction));
  if (applied) ctx.emitLocalAction(resolveAction);
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
      // Ficha 4 (multi): si el ataque venía diferido, ahora el DEFENSOR local elige su trampa reactiva y la
      // resolución se emite. En un ataque normal (sin pausa) esto es un no-op y el flujo sigue igual.
      await maybeResolveLocalReactiveTrap(ctx);
      await sleep(TIMINGS.postResolutionMs);
      if (target && defenderId) ctx.setRevealedEntities((prev) => removeRevealedId(prev, defenderId));
      ctx.setActiveAttackerId(null);
      ctx.setIsAnimating(false);
      return;
    }

    // Ficha 4 (multi): el ATACANTE recibe la resolución que el defensor eligió. Revelamos la trampa activada
    // (si activó una) para que el atacante VEA cuál saltó, aplicamos, y liberamos el bloqueo de "esperando
    // al rival" que dejó puesto el ataque diferido. Si el defensor pasó, solo aplicamos.
    case "RESOLVE_REACTIVE_TRAP": {
      const chosenTrapInstanceId = action.payload.activate ? action.payload.chosenTrapInstanceId : undefined;
      const chosenTrap = chosenTrapInstanceId
        ? opponent.activeExecutions.find((execution) => execution.instanceId === chosenTrapInstanceId) ?? null
        : null;
      ctx.setIsAnimating(true);
      if (chosenTrap) {
        ctx.setRevealedEntities((prev) => addRevealedId(prev, chosenTrap.instanceId));
        await sleep(TIMINGS.executionPreviewMs);
      }
      apply(ctx, opponentId, action);
      await sleep(TIMINGS.postResolutionMs);
      if (chosenTrap) ctx.setRevealedEntities((prev) => removeRevealedId(prev, chosenTrap.instanceId));
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
