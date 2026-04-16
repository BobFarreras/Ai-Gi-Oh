// src/components/game/board/ui/overlays/internal/direct-damage-beam-overlay-readers.ts - Lectores de payload y contexto para señales de daño directo.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export interface ITrapContextSignal {
  fromTrap: boolean;
  trapAction: string | null;
}

function asPayload(event: ICombatLogEvent): Record<string, unknown> | null {
  return typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
}

export function readTargetPlayerId(event: ICombatLogEvent): string | null {
  const payload = asPayload(event);
  return payload && typeof payload.targetPlayerId === "string" ? payload.targetPlayerId : null;
}

export function readCardIdFromPayload(event: ICombatLogEvent, key: "trapCardId" | "cardId"): string | null {
  const payload = asPayload(event);
  return payload && typeof payload[key] === "string" ? payload[key] : null;
}

export function resolveSourceCardId(events: ICombatLogEvent[], fromIndex: number, actorPlayerId: string): string | null {
  for (let index = fromIndex - 1; index >= 0 && fromIndex - index <= 6; index -= 1) {
    const event = events[index];
    if (event.actorPlayerId !== actorPlayerId) continue;
    if (event.eventType === "TRAP_TRIGGERED") return readCardIdFromPayload(event, "trapCardId");
    if (event.eventType === "CARD_PLAYED") {
      const payload = asPayload(event);
      const isExecutionActivation = payload?.cardType === "EXECUTION" && payload?.mode === "ACTIVATE";
      if (isExecutionActivation && typeof payload.cardId === "string") return payload.cardId;
    }
    if (event.eventType !== "CARD_TO_GRAVEYARD") continue;
    const payload = asPayload(event);
    if (payload && payload.from === "EXECUTION_ZONE" && typeof payload.cardId === "string") return payload.cardId;
  }
  return null;
}

export function resolveTrapContextSignal(events: ICombatLogEvent[], fromIndex: number, actorPlayerId: string): ITrapContextSignal {
  for (let index = fromIndex - 1; index >= 0 && fromIndex - index <= 6; index -= 1) {
    const event = events[index];
    if (event.actorPlayerId !== actorPlayerId || event.eventType !== "TRAP_TRIGGERED") continue;
    const payload = asPayload(event);
    const trapAction = payload && typeof payload.effectAction === "string" ? payload.effectAction : null;
    return { fromTrap: true, trapAction };
  }
  return { fromTrap: false, trapAction: null };
}

export function readSourceCardId(event: ICombatLogEvent): string | null {
  const payload = asPayload(event);
  return payload && typeof payload.sourceCardId === "string" ? payload.sourceCardId : null;
}

export function readSourceSlotIndex(event: ICombatLogEvent): number | null {
  const payload = asPayload(event);
  return payload && typeof payload.sourceSlotIndex === "number" ? payload.sourceSlotIndex : null;
}

export function readSourceLaneType(event: ICombatLogEvent): "EXECUTIONS" | "ENTITIES" | null {
  const payload = asPayload(event);
  return payload && (payload.sourceLaneType === "EXECUTIONS" || payload.sourceLaneType === "ENTITIES") ? payload.sourceLaneType : null;
}
