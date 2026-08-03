// src/core/services/opponent/build-opponent-play-action.ts - Traduce una decisión táctica de IA al protocolo reproducible.
import { IMatchActionPayload } from "@/core/entities/match";
import { IOpponentStrategy } from "./types";

type OpponentPlayDecision = NonNullable<ReturnType<IOpponentStrategy["choosePlay"]>>;

/** Conserva reemplazos y materiales exactos para que el servidor reproduzca la jugada. */
export function buildOpponentPlayAction(decision: OpponentPlayDecision): IMatchActionPayload {
  if (decision.fusionMaterialInstanceIds) {
    return {
      type: "FUSE_CARDS",
      payload: {
        cardId: decision.cardId,
        material1InstanceId: decision.fusionMaterialInstanceIds[0],
        material2InstanceId: decision.fusionMaterialInstanceIds[1],
        mode: decision.mode === "DEFENSE" ? "DEFENSE" : "ATTACK",
      },
    };
  }
  if (decision.replaceEntityInstanceId) {
    return {
      type: "PLAY_CARD_REPLACE_ENTITY",
      payload: {
        cardId: decision.cardId,
        mode: decision.mode,
        sacrificedEntityInstanceId: decision.replaceEntityInstanceId,
      },
    };
  }
  if (decision.replaceExecutionInstanceId) {
    return {
      type: "PLAY_CARD_REPLACE_ZONE",
      payload: {
        cardId: decision.cardId,
        mode: decision.mode,
        sacrificedEntityInstanceId: decision.replaceExecutionInstanceId,
        zone: "EXECUTIONS",
      },
    };
  }
  return { type: "PLAY_CARD", payload: { cardId: decision.cardId, mode: decision.mode } };
}

/** Codifica la elección reactiva del humano dentro de la resolución rival. */
export function buildOpponentExecutionAction(
  instanceId: string,
  activateReactiveTrap: boolean,
  chosenTrapInstanceId?: string,
): IMatchActionPayload {
  return {
    type: "RESOLVE_EXECUTION",
    payload: {
      instanceId,
      declineReactiveTrap: !activateReactiveTrap || undefined,
      chosenTrapInstanceId: activateReactiveTrap ? chosenTrapInstanceId : undefined,
    },
  };
}
