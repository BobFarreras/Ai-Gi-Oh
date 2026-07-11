// src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.ts - Gestiona clics sobre entidades propias según fase, acciones pendientes y animaciones.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { IUsePlayerActionsParams } from "./types";
import { MouseEvent } from "react";

interface IHandleOwnEntityClickParams extends Pick<
  IUsePlayerActionsParams,
  | "activeAttackerId"
  | "applyTransition"
  | "clearSelection"
  | "gameState"
  | "pendingFusionSummon"
  | "pendingEntityReplacement"
  | "pendingEntityReplacementTargetId"
  | "setActiveAttackerId"
  | "setLastError"
  | "setPendingEntityReplacementTargetId"
  | "setPendingFusionSummon"
  | "setPlayingCard"
  | "setSelectedCard"
  | "setSelectedBoardEntityInstanceId"
> {
  entity: IBoardEntity | null;
  event: MouseEvent;
}

export async function handleOwnEntityClick({
  entity,
  event,
  activeAttackerId,
  applyTransition,
  clearSelection,
  gameState,
  pendingFusionSummon,
  pendingEntityReplacement,
  pendingEntityReplacementTargetId,
  setActiveAttackerId,
  setLastError,
  setPendingEntityReplacementTargetId,
  setPendingFusionSummon,
  setPlayingCard,
  setSelectedCard,
  setSelectedBoardEntityInstanceId,
}: IHandleOwnEntityClickParams): Promise<"handled" | "pass"> {
  if (!entity) return "pass";

  if (pendingEntityReplacement) {
    const selectableIds =
      pendingEntityReplacement.zone === "ENTITIES"
        ? gameState.playerA.activeEntities.map((current) => current.instanceId)
        : gameState.playerA.activeExecutions.map((current) => current.instanceId);
    if (!selectableIds.includes(entity.instanceId)) {
      setLastError({
        code: "GAME_RULE_ERROR",
        message:
          pendingEntityReplacement.zone === "ENTITIES"
            ? "Debes seleccionar una entidad de tu campo para reemplazar."
            : "Debes seleccionar una ejecución de tu campo para reemplazar.",
      });
      return "handled";
    }
    if (pendingEntityReplacementTargetId !== entity.instanceId) {
      setPendingEntityReplacementTargetId(entity.instanceId);
      setSelectedCard(entity.card);
      setSelectedBoardEntityInstanceId(entity.instanceId);
    }
    return "handled";
  }
  if (pendingFusionSummon) {
    if (pendingFusionSummon.materials.includes(entity.instanceId)) {
      setPendingFusionSummon({
        ...pendingFusionSummon,
        materials: pendingFusionSummon.materials.filter((id) => id !== entity.instanceId),
      });
      return "handled";
    }
    const nextMaterials = [...pendingFusionSummon.materials, entity.instanceId].slice(0, 2);
    if (nextMaterials.length < 2) {
      setPendingFusionSummon({ ...pendingFusionSummon, materials: nextMaterials });
      return "handled";
    }
    const fusedState = applyTransition((state) =>
      GameEngine.fuseCards(state, state.playerA.id, pendingFusionSummon.cardId, [nextMaterials[0], nextMaterials[1]], pendingFusionSummon.mode),
    );
    if (fusedState) {
      setPendingFusionSummon(null);
      clearSelection();
    }
    return "handled";
  }

  if (gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS") {
    applyTransition((state) => GameEngine.resolvePendingTurnAction(state, state.playerA.id, entity.instanceId));
    return "handled";
  }

  if ((entity.card.type === "EXECUTION" || entity.card.type === "TRAP") && entity.mode === "SET") {
    setSelectedCard(entity.card);
    setSelectedBoardEntityInstanceId(entity.instanceId);
    setPlayingCard(null);
    setLastError(null);
    return "handled";
  }

  if (gameState.phase !== "BATTLE") {
    setSelectedCard(entity.card);
    return "handled";
  }

  if (entity.hasAttackedThisTurn) return "handled";
  if (entity.mode === "DEFENSE" || entity.mode === "SET") {
    // Doble click sobre una entidad en DEFENSA (boca arriba) la devuelve a ATAQUE: es el inverso
    // simétrico del doble-click ATTACK->DEFENSE de más abajo. Las cartas SET (boca abajo) no se
    // voltean con este gesto (revelarlas es otra acción). `changeEntityMode` respeta `modeLock`,
    // así que una entidad bloqueada en defensa simplemente no cambia (no-op silencioso).
    if (entity.mode === "DEFENSE" && event.detail >= 2) {
      applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, entity.instanceId, "ATTACK"));
    }
    setSelectedCard(entity.card);
    setSelectedBoardEntityInstanceId(entity.instanceId);
    setPlayingCard(null);
    setLastError(null);
    return "handled";
  }
  if (entity.mode !== "ATTACK") return "handled";
  if (activeAttackerId === entity.instanceId) {
    if (event.detail >= 2) {
      const changedState = applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, entity.instanceId, "DEFENSE"));
      if (changedState) {
        setActiveAttackerId(null);
      }
    }
    setSelectedCard(entity.card);
    setSelectedBoardEntityInstanceId(entity.instanceId);
    return "handled";
  }
  // Carta bloqueada (LOCK_OPPONENT_ENTITY): no se puede seleccionar como atacante. En vez del error rojo
  // del motor, mostramos un aviso de BLOQUEO con los turnos restantes y abrimos su detalle igualmente.
  const lockedTurns = entity.lockedTurnsRemaining ?? 0;
  if (lockedTurns > 0) {
    setLastError({
      code: "GAME_RULE_ERROR",
      tone: "blocked",
      message: `Carta bloqueada · faltan ${lockedTurns} ${lockedTurns === 1 ? "turno" : "turnos"} para desbloquearse.`,
    });
    setSelectedCard(entity.card);
    setSelectedBoardEntityInstanceId(entity.instanceId);
    return "handled";
  }
  setActiveAttackerId((previous) => (previous === entity.instanceId ? null : entity.instanceId));
  setSelectedCard(entity.card);
  setSelectedBoardEntityInstanceId(entity.instanceId);
  setPlayingCard(null);
  setLastError(null);
  return "handled";
}
