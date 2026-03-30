// src/components/game/board/hooks/internal/player-actions/handleOpponentEntityClick.ts - Gestiona clics sobre entidades rivales cuando existe un atacante seleccionado.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { sleep } from "../sleep";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "../trapPreview";
import { PLAYER_POST_RESOLUTION_MS, PLAYER_TRAP_PREVIEW_MS } from "./constants";
import { IUsePlayerActionsParams } from "./types";

interface IHandleOpponentEntityClickParams extends Pick<
  IUsePlayerActionsParams,
  | "activeAttackerId"
  | "applyTransition"
  | "clearSelection"
  | "gameState"
  | "setActiveAttackerId"
  | "setIsAnimating"
  | "setRevealedEntities"
  | "setSelectedCard"
> {
  /** Entidad objetivo del rival; `null` representa intento de ataque directo. */
  entity: IBoardEntity | null;
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
  clearSelection,
  gameState,
  setActiveAttackerId,
  setIsAnimating,
  setRevealedEntities,
  setSelectedCard,
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

  const reactiveTrap = findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_ATTACK_DECLARED");
  const playerCounterTrap = reactiveTrap
    ? findReactiveTrap(gameState, gameState.playerA.id, "ON_OPPONENT_TRAP_ACTIVATED")
    : null;
  if (reactiveTrap) {
    setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
    setActiveAttackerId(reactiveTrap.instanceId);
    setSelectedCard(reactiveTrap.card);
    await sleep(PLAYER_TRAP_PREVIEW_MS);
    setActiveAttackerId(attackerId);
  }
  if (playerCounterTrap) {
    setRevealedEntities((previous) => addRevealedId(previous, playerCounterTrap.instanceId));
    setActiveAttackerId(playerCounterTrap.instanceId);
    setSelectedCard(playerCounterTrap.card);
    await sleep(PLAYER_TRAP_PREVIEW_MS);
    setActiveAttackerId(attackerId);
  }

  applyTransition((state) => GameEngine.executeAttack(state, state.playerA.id, attackerId, targetId));
  if (shouldRevealTargetBeforeBattle && targetId) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    setRevealedEntities((previous) => removeRevealedId(previous, targetId));
  }
  if (reactiveTrap) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
  }
  if (playerCounterTrap) {
    await sleep(PLAYER_POST_RESOLUTION_MS);
    setRevealedEntities((previous) => removeRevealedId(previous, playerCounterTrap.instanceId));
  }
  setSelectedCard(null);
  setActiveAttackerId(null);
  setIsAnimating(false);
  return "handled";
}
