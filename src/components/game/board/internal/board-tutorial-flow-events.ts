// src/components/game/board/internal/board-tutorial-flow-events.ts - Helpers puros para consultar eventos del combatLog en tutorial de combate.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export function hasEvent(events: ICombatLogEvent[], eventType: ICombatLogEvent["eventType"]): boolean {
  return events.some((event) => event.eventType === eventType);
}

export function hasCardPlayed(events: ICombatLogEvent[], cardId: string, mode?: string): boolean {
  return events.some((event) => {
    if (event.eventType !== "CARD_PLAYED") return false;
    const sameCard = event.payload.cardId === cardId;
    if (!sameCard) return false;
    return mode ? event.payload.mode === mode : true;
  });
}

export function hasOpponentCardPlayedInMode(events: ICombatLogEvent[], mode: string): boolean {
  return events.some((event) => {
    if (event.eventType !== "CARD_PLAYED") return false;
    if (event.actorPlayerId !== "opponent-local") return false;
    const payloadMode = event.payload.mode;
    return typeof payloadMode === "string" && payloadMode === mode;
  });
}

export function countOpponentCardPlayed(events: ICombatLogEvent[]): number {
  return events.filter((event) => event.eventType === "CARD_PLAYED" && event.actorPlayerId === "opponent-local").length;
}

export function countTurnStartedByActor(events: ICombatLogEvent[], actorPlayerId: string): number {
  return events.filter((event) => event.eventType === "TURN_STARTED" && event.actorPlayerId === actorPlayerId).length;
}

export function hasOpponentTurnStarted(events: ICombatLogEvent[]): boolean {
  return events.some((event) => event.eventType === "TURN_STARTED" && event.actorPlayerId === "opponent-local");
}

export function hasPlayerBattlePhase(events: ICombatLogEvent[]): boolean {
  return events.some((event) => event.eventType === "PHASE_CHANGED" && event.actorPlayerId === "player-local" && event.payload.toPhase === "BATTLE");
}

export function hasTrapResolution(events: ICombatLogEvent[]): boolean {
  return events.some((event) => event.eventType === "TRAP_TRIGGERED");
}

export function countTrapResolutions(events: ICombatLogEvent[]): number {
  return events.filter((event) => event.eventType === "TRAP_TRIGGERED").length;
}

export function countPlayerDirectDamage(events: ICombatLogEvent[]): number {
  return events.filter((event) => event.eventType === "DIRECT_DAMAGE" && event.actorPlayerId === "player-local").length;
}

export function hasPlayerBattleResolvedAgainstEntity(events: ICombatLogEvent[], attackerCardId: string): boolean {
  return events.some((event) => {
    if (event.eventType !== "BATTLE_RESOLVED") return false;
    if (event.actorPlayerId !== "player-local") return false;
    const payloadAttackerCardId = event.payload.attackerCardId;
    const payloadDefenderCardId = event.payload.defenderCardId;
    return payloadAttackerCardId === attackerCardId && typeof payloadDefenderCardId === "string" && payloadDefenderCardId.length > 0;
  });
}

export function hasPlayerDirectAttackByCard(events: ICombatLogEvent[], attackerCardId: string): boolean {
  return events.some((event) => {
    if (event.eventType !== "ATTACK_DECLARED") return false;
    if (event.actorPlayerId !== "player-local") return false;
    const payloadAttackerCardId = event.payload.attackerCardId;
    const payloadTarget = event.payload.target;
    return payloadAttackerCardId === attackerCardId && payloadTarget === "DIRECT";
  });
}
