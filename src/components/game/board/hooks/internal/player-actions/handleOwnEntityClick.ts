// src/components/game/board/hooks/internal/player-actions/handleOwnEntityClick.ts - Gestiona clics sobre entidades propias según fase, acciones pendientes y animaciones.
import { GameEngine } from "@/core/use-cases/GameEngine";
import { canAttackFromDefense } from "@/core/use-cases/game-engine/state/status-effects";
import { IHandleOwnEntityClickParams } from "./handle-own-entity-click.types";

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
  // Escudo Firewall Ofensivo: con el estado activo, una defensora (boca arriba) se selecciona como ATACANTE
  // (atacará con su DEF), SIN cambiar de modo ni voltearse. Las SET (boca abajo) no.
  if (entity.mode === "DEFENSE" && canAttackFromDefense(gameState.activeStatusEffects, gameState.playerA.id)) {
    setActiveAttackerId((previous) => (previous === entity.instanceId ? null : entity.instanceId));
    setSelectedCard(entity.card);
    setSelectedBoardEntityInstanceId(entity.instanceId);
    setPlayingCard(null);
    setLastError(null);
    return "handled";
  }
  if (entity.mode === "DEFENSE" || entity.mode === "SET") {
    // Doble click sobre una entidad propia en DEFENSA (boca arriba) la devuelve a ATAQUE.
    // Doble click sobre una ENTITY propia en SET (boca abajo) la voltea a DEFENSE para que
    // pueda atacar posteriormente. Solo aplica a entities, no a ejecuciones/trampas.
    if (event.detail >= 2) {
      if (entity.mode === "DEFENSE" && entity.card.type === "ENTITY") {
        applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, entity.instanceId, "ATTACK"));
      } else if (entity.mode === "SET" && entity.card.type === "ENTITY") {
        applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, entity.instanceId, "DEFENSE"));
      }
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
