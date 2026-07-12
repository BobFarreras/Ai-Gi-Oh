// src/components/game/board/hooks/internal/player-actions/useHandleEntityClick.ts - Orquesta clics sobre entidades propias/rivales y delega flujos según contexto de acción.
import { useCallback } from "react";
import { useLocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { IUsePlayerActionsParams } from "./types";
import { handleOwnEntityClick } from "./handleOwnEntityClick";
import { handleOpponentEntityClick } from "./handleOpponentEntityClick";
import { sleep } from "../sleep";
import { addRevealedId, removeRevealedId } from "../trapPreview";

// Tiempo que la carta seteada revelada permanece boca arriba para que el jugador la vea.
const OPPONENT_SET_REVEAL_MS = 2200;

type IHandleEntityClickParams = Pick<
  IUsePlayerActionsParams,
  | "activeAttackerId"
  | "applyTransition"
  | "assertPlayerTurn"
  | "requestTrapActivationDecision"
  | "clearError"
  | "clearSelection"
  | "gameState"
  | "isAnimating"
  | "pendingEntityReplacement"
  | "pendingEntityReplacementTargetId"
  | "pendingFusionSummon"
  | "resolvePendingTurnAction"
  | "setActiveAttackerId"
  | "setIsAnimating"
  | "setLastError"
  | "setPendingEntityReplacement"
  | "setPendingEntityReplacementTargetId"
  | "setPendingFusionSummon"
  | "setPlayingCard"
  | "setRevealedEntities"
  | "setSelectedCard"
  | "setSelectedBoardEntityInstanceId"
>;

export function useHandleEntityClick(params: IHandleEntityClickParams) {
  const emitLocalAction = useLocalActionEmitter();
  return useCallback(
    async (entity: IUsePlayerActionsParams["gameState"]["playerA"]["activeEntities"][number] | null, isOpponent: boolean, event: React.MouseEvent) => {
      event.stopPropagation();

      // En el turno del rival no se puede ACTUAR, pero sí INSPECCIONAR el detalle de cartas boca arriba
      // (propias y rivales reveladas) para planear estrategia mientras esperas. Sin acciones ni error de turno.
      const isPlayerTurn = params.gameState.activePlayerId === params.gameState.playerA.id;
      if (!isPlayerTurn) {
        if (entity && !(isOpponent && entity.mode === "SET")) {
          params.setSelectedCard(entity.card);
          params.setSelectedBoardEntityInstanceId(null);
        }
        return;
      }

      if (params.isAnimating || !params.assertPlayerTurn()) return;

      if (params.gameState.pendingTurnAction?.playerId === params.gameState.playerA.id) {
        const pending = params.gameState.pendingTurnAction;
        // Revelar carta seteada del rival: a diferencia del resto de acciones obligatorias,
        // esta se resuelve clicando una carta boca abajo del RIVAL, no una propia.
        if (pending.type === "SELECT_OPPONENT_SET_CARD") {
          if (isOpponent && entity && entity.mode === "SET") {
            params.setIsAnimating(true);
            params.setRevealedEntities((previous) => addRevealedId(previous, entity.instanceId));
            // Resolvemos primero (internamente hace clearSelection) y DESPUÉS abrimos el detalle,
            // si no, la limpieza de selección borraría la carta y no se vería el detalle.
            params.resolvePendingTurnAction(entity.instanceId);
            params.setSelectedCard(entity.card);
            await sleep(OPPONENT_SET_REVEAL_MS);
            params.setRevealedEntities((previous) => removeRevealedId(previous, entity.instanceId));
            params.setIsAnimating(false);
            // Dejamos el detalle (selectedCard) abierto para que el jugador aprecie la carta;
            // se cierra solo cuando pulse otra cosa o el botón de cerrar.
            return;
          }
          params.setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona una carta boca abajo (seteada) del rival para revelarla." });
          return;
        }
        // Bloquear entity rival: se resuelve clicando una entity del RIVAL (cualquier modo).
        if (pending.type === "SELECT_OPPONENT_ENTITY_TO_LOCK") {
          if (isOpponent && entity) {
            params.resolvePendingTurnAction(entity.instanceId);
            return;
          }
          params.setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona una entity del rival para bloquearla." });
          return;
        }
        if (!isOpponent && entity) {
          params.resolvePendingTurnAction(entity.instanceId);
          return;
        }
        params.setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      params.clearError();
      if (params.pendingEntityReplacement && isOpponent) {
        params.setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona una entidad de tu campo para reemplazarla." });
        return;
      }

      if (!isOpponent) {
        const result = await handleOwnEntityClick({
          entity,
          event,
          activeAttackerId: params.activeAttackerId,
          applyTransition: params.applyTransition,
          clearSelection: params.clearSelection,
          gameState: params.gameState,
          pendingFusionSummon: params.pendingFusionSummon,
          pendingEntityReplacement: params.pendingEntityReplacement,
          pendingEntityReplacementTargetId: params.pendingEntityReplacementTargetId,
          setActiveAttackerId: params.setActiveAttackerId,
          setLastError: params.setLastError,
          setPendingEntityReplacementTargetId: params.setPendingEntityReplacementTargetId,
          setPendingFusionSummon: params.setPendingFusionSummon,
          setPlayingCard: params.setPlayingCard,
          setSelectedCard: params.setSelectedCard,
          setSelectedBoardEntityInstanceId: params.setSelectedBoardEntityInstanceId,
        });
        if (result === "handled") return;
      }

      // Una entidad solo puede atacar a ENTIDADES rivales (o directo si el rival no tiene ninguna). La
      // zona de magias/trampas NO es objetivo válido: sin este guard, el clic revelaba la carta e intentaba
      // atacarla, fallando con "La carta defensora no está en el campo". Mantenemos el atacante seleccionado.
      if (
        params.activeAttackerId &&
        isOpponent &&
        entity &&
        (entity.card.type === "EXECUTION" || entity.card.type === "TRAP")
      ) {
        params.setLastError({
          code: "GAME_RULE_ERROR",
          message: "Una entidad no puede atacar a la zona de magias/trampas del rival. Ataca a una entidad rival (o directamente si no tiene ninguna).",
        });
        return;
      }

      const result = await handleOpponentEntityClick({
        entity,
        activeAttackerId: params.activeAttackerId,
        applyTransition: params.applyTransition,
        requestTrapActivationDecision: params.requestTrapActivationDecision,
        clearSelection: params.clearSelection,
        gameState: params.gameState,
        setActiveAttackerId: params.setActiveAttackerId,
        setIsAnimating: params.setIsAnimating,
        setRevealedEntities: params.setRevealedEntities,
        setSelectedCard: params.setSelectedCard,
        emitLocalAction,
      });
      if (result === "handled") return;

      if (entity) {
        // No se puede espiar una carta boca abajo del rival: su detalle solo se ve si está boca
        // arriba (ATTACK/DEFENSE/ACTIVATE) o si se reveló con una carta mágica (flujo aparte).
        if (isOpponent && entity.mode === "SET") {
          params.setSelectedCard(null);
          return;
        }
        params.setSelectedCard(entity.card);
        params.setSelectedBoardEntityInstanceId(null);
      }
    },
    [params, emitLocalAction],
  );
}
