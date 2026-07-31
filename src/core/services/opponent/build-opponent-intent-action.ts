// src/core/services/opponent/build-opponent-intent-action.ts - Traduce la intención del rival al protocolo reproducible.
import { IMatchActionPayload } from "@/core/entities/match";
import { buildOpponentExecutionAction, buildOpponentPlayAction } from "./build-opponent-play-action";
import { IPlayerTrapChoice, OpponentIntent } from "./resolve-opponent-intent";

/** Traduce la intención ya resuelta al protocolo reproducible; null si no viaja por el journal. */
export function buildOpponentIntentAction(
  intent: OpponentIntent,
  trapChoice: IPlayerTrapChoice = { activate: false },
): IMatchActionPayload | null {
  switch (intent.kind) {
    case "RESOLVE_PENDING_TURN_ACTION":
      return { type: "RESOLVE_PENDING_TURN_ACTION", payload: { selectedId: intent.selectedId } };
    case "RESOLVE_EXECUTION":
      return buildOpponentExecutionAction(intent.instanceId, trapChoice.activate, trapChoice.chosenTrapInstanceId);
    case "ACTIVATE_SET_EXECUTION":
      return { type: "CHANGE_ENTITY_MODE", payload: { instanceId: intent.instanceId, newMode: "ACTIVATE" } };
    case "PLAY":
      return buildOpponentPlayAction(intent.decision);
    case "ATTACK":
      return {
        type: "ATTACK",
        payload: {
          attackerInstanceId: intent.decision.attackerInstanceId,
          defenderInstanceId: intent.decision.defenderInstanceId,
          declineReactiveTrap: !trapChoice.activate || undefined,
          chosenTrapInstanceId: trapChoice.activate ? trapChoice.chosenTrapInstanceId : undefined,
        },
      };
    case "CHANGE_ENTITY_MODE":
      return { type: "CHANGE_ENTITY_MODE", payload: intent.decision };
    case "NEXT_PHASE":
      return { type: "NEXT_PHASE", payload: {} };
    default:
      return null;
  }
}
