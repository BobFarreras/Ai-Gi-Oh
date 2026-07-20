// src/components/game/board/hooks/internal/player-actions/handleOpponentEntityClick.ts - Gestiona clics sobre entidades rivales cuando existe un atacante seleccionado.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { LocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { sleep } from "../sleep";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "../trapPreview";
import { PLAYER_POST_RESOLUTION_MS, PLAYER_TRAP_PREVIEW_MS } from "./constants";
import { IUsePlayerActionsParams } from "./types";

interface IHandleOpponentEntityClickParams extends Pick<
  IUsePlayerActionsParams,
  | "activeAttackerId"
  | "applyTransition"
  | "requestTrapActivationDecision"
  | "clearSelection"
  | "gameState"
  | "setActiveAttackerId"
  | "setIsAnimating"
  | "setRevealedEntities"
  | "setSelectedCard"
> {
  /** Entidad objetivo del rival; `null` representa intento de ataque directo. */
  entity: IBoardEntity | null;
  /** Ficha 4: en multi el ataque DIFIERE la trampa reactiva del defensor para que la elija en su cliente. */
  isMultiplayer: boolean;
  /** Emisor de la acción al rival en multijugador (noop en otros modos). */
  emitLocalAction: LocalActionEmitter;
}

/**
 * Resuelve la secuencia de ataque contra objetivo rival o ataque directo.
 * @param params Dependencias de estado, transición y entidad objetivo.
 * @returns `handled` cuando consume el clic; `pass` cuando no hay atacante activo.
 */
export async function handleOpponentEntityClick({
  entity,
  activeAttackerId,
  applyTransition,
  requestTrapActivationDecision,
  clearSelection,
  gameState,
  setActiveAttackerId,
  setIsAnimating,
  setRevealedEntities,
  setSelectedCard,
  isMultiplayer,
  emitLocalAction,
}: IHandleOpponentEntityClickParams): Promise<"handled" | "pass"> {
  if (!activeAttackerId) {
    if (entity) return "pass";
    return "handled";
  }

  setIsAnimating(true);
  const attackerId = activeAttackerId;
  const targetId = entity?.instanceId;
  clearSelection();
  const shouldRevealTargetBeforeBattle = Boolean(entity && entity.mode === "SET" && targetId);
  if (shouldRevealTargetBeforeBattle && targetId) {
    setRevealedEntities((previous) => addRevealedId(previous, targetId));
    await sleep(320);
  }

  // Un ataque dispara ON_OPPONENT_ATTACK_DECLARED siempre y, si es directo (sin objetivo),
  // también ON_OPPONENT_DIRECT_ATTACK_DECLARED. Detectamos ambos para que el contra-trampa del
  // jugador pueda decidirse frente a cualquier trampa rival que vaya a saltar.
  const isDirectAttack = !targetId;
  const reactiveTrap =
    findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_ATTACK_DECLARED", { defenderInstanceId: targetId ?? undefined }) ??
    (isDirectAttack ? findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_DIRECT_ATTACK_DECLARED") : null);
  const playerCounterTrap = reactiveTrap
    ? findReactiveTrap(gameState, gameState.playerA.id, "ON_OPPONENT_TRAP_ACTIVATED")
    : null;

  // Ficha 4 (multi): si el defensor (rival) tiene una trampa reactiva elegible, NO la resolvemos aquí.
  // DIFERIMOS el ataque para que el defensor elija cuál activar (o pasar) en SU cliente. No pre-revelamos
  // ninguna trampa concreta del rival —la que salte la decide él—; el atacante sí decide ANTES su
  // contra-trampa (Nullify), y ese `declineCounterTrap` viaja en la pausa igual que en single-player.
  if (isMultiplayer && reactiveTrap) {
    const activateCounterTrap = playerCounterTrap
      ? (await requestTrapActivationDecision([{ card: playerCounterTrap.card, instanceId: playerCounterTrap.instanceId }], "ON_OPPONENT_TRAP_ACTIVATED")).activate
      : false;
    const declineCounterTrap = Boolean(playerCounterTrap) && !activateCounterTrap;
    const deferred = applyTransition((state) =>
      GameEngine.executeAttack(state, state.playerA.id, attackerId, targetId, {
        deferReactiveTraps: true,
        ...(declineCounterTrap ? { skipCounterTrapPlayerIds: [state.playerA.id] } : {}),
      }),
    );
    // Si el motor pausó (había ≥1 elegible), el tablero queda BLOQUEADO "esperando la decisión del rival":
    // el RESOLVE_REACTIVE_TRAP remoto del defensor lo desbloqueará al aplicarse (animate-remote-action).
    if (deferred?.pendingReactiveTrapDecision) {
      emitLocalAction({
        type: "ATTACK",
        payload: { attackerInstanceId: attackerId, defenderInstanceId: targetId, deferReactiveTraps: true, declineCounterTrap: declineCounterTrap || undefined },
      });
      setSelectedCard(null);
      setActiveAttackerId(null);
      // Deliberadamente NO liberamos isAnimating: el turno espera la elección remota, no un error.
      return "handled";
    }
    // Defensivo: si no pausó (la trampa dejó de ser elegible), cerramos como un ataque normal ya resuelto.
    if (deferred) {
      emitLocalAction({ type: "ATTACK", payload: { attackerInstanceId: attackerId, defenderInstanceId: targetId, declineCounterTrap: declineCounterTrap || undefined } });
    }
    setSelectedCard(null);
    setActiveAttackerId(null);
    setIsAnimating(false);
    return "handled";
  }

  if (reactiveTrap) {
    setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
    setActiveAttackerId(reactiveTrap.instanceId);
    setSelectedCard(reactiveTrap.card);
    await sleep(PLAYER_TRAP_PREVIEW_MS);
    setActiveAttackerId(attackerId);
  }
  // El jugador decide si activa su contra-trampa (Nullify) para negar la trampa rival, igual que el
  // resto de trampas. Si la rechaza, la trampa rival resuelve con normalidad.
  const activateCounterTrap = playerCounterTrap
    ? (await requestTrapActivationDecision([{ card: playerCounterTrap.card, instanceId: playerCounterTrap.instanceId }], "ON_OPPONENT_TRAP_ACTIVATED")).activate
    : false;
  if (playerCounterTrap && activateCounterTrap) {
    setRevealedEntities((previous) => addRevealedId(previous, playerCounterTrap.instanceId));
    setActiveAttackerId(playerCounterTrap.instanceId);
    setSelectedCard(playerCounterTrap.card);
    await sleep(PLAYER_TRAP_PREVIEW_MS);
    setActiveAttackerId(attackerId);
  }

  const declineCounterTrap = Boolean(playerCounterTrap) && !activateCounterTrap;
  const attacked = applyTransition((state) =>
    GameEngine.executeAttack(state, state.playerA.id, attackerId, targetId, declineCounterTrap ? { skipCounterTrapPlayerIds: [state.playerA.id] } : undefined),
  );
  if (attacked) {
    emitLocalAction({ type: "ATTACK", payload: { attackerInstanceId: attackerId, defenderInstanceId: targetId, declineCounterTrap: declineCounterTrap || undefined } });
  }
  if (shouldRevealTargetBeforeBattle && targetId) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    setRevealedEntities((previous) => removeRevealedId(previous, targetId));
  }
  if (reactiveTrap) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
  }
  if (playerCounterTrap && activateCounterTrap) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    setRevealedEntities((previous) => removeRevealedId(previous, playerCounterTrap.instanceId));
  }
  setSelectedCard(null);
  setActiveAttackerId(null);
  setIsAnimating(false);
  return "handled";
}
