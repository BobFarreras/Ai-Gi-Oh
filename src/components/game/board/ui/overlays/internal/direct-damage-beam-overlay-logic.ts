// src/components/game/board/ui/overlays/internal/direct-damage-beam-overlay-logic.ts - Lógica de señal y trayectoria para rayo de daño directo por efecto.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export interface IDirectDamageSignal {
  id: string;
  towardsPlayer: boolean;
  fromPlayerA: boolean;
  sourceCardId: string | null;
  sourceSlotIndex: number | null;
  sourceLaneType: "EXECUTIONS" | "ENTITIES" | null;
  startDelayMs: number;
}

export interface IPoint { x: number; y: number; }
export interface ITrajectory { source: IPoint; control: IPoint; target: IPoint; }

function readTargetPlayerId(event: ICombatLogEvent): string | null {
  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  return payload && typeof payload.targetPlayerId === "string" ? payload.targetPlayerId : null;
}

function readCardIdFromPayload(event: ICombatLogEvent, key: "trapCardId" | "cardId"): string | null {
  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  return payload && typeof payload[key] === "string" ? (payload[key] as string) : null;
}

function resolveSourceCardId(events: ICombatLogEvent[], fromIndex: number, actorPlayerId: string): string | null {
  for (let index = fromIndex - 1; index >= 0 && fromIndex - index <= 6; index -= 1) {
    const event = events[index];
    if (event.actorPlayerId !== actorPlayerId) continue;
    if (event.eventType === "TRAP_TRIGGERED") return readCardIdFromPayload(event, "trapCardId");
    if (event.eventType === "CARD_PLAYED") {
      const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
      const isExecutionActivation = payload?.cardType === "EXECUTION" && payload?.mode === "ACTIVATE";
      if (isExecutionActivation && typeof payload.cardId === "string") return payload.cardId;
    }
    if (event.eventType !== "CARD_TO_GRAVEYARD") continue;
    const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
    if (payload && payload.from === "EXECUTION_ZONE" && typeof payload.cardId === "string") return payload.cardId;
  }
  return null;
}

interface ITrapContextSignal {
  fromTrap: boolean;
  trapAction: string | null;
}

function resolveTrapContextSignal(events: ICombatLogEvent[], fromIndex: number, actorPlayerId: string): ITrapContextSignal {
  for (let index = fromIndex - 1; index >= 0 && fromIndex - index <= 6; index -= 1) {
    const event = events[index];
    if (event.actorPlayerId !== actorPlayerId) continue;
    if (event.eventType !== "TRAP_TRIGGERED") continue;
    const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
    const trapAction = payload && typeof payload.effectAction === "string" ? payload.effectAction : null;
    return { fromTrap: true, trapAction };
  }
  return { fromTrap: false, trapAction: null };
}

function readSourceCardId(event: ICombatLogEvent): string | null {
  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  return payload && typeof payload.sourceCardId === "string" ? payload.sourceCardId : null;
}

function readSourceSlotIndex(event: ICombatLogEvent): number | null {
  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  return payload && typeof payload.sourceSlotIndex === "number" ? payload.sourceSlotIndex : null;
}

function readSourceLaneType(event: ICombatLogEvent): "EXECUTIONS" | "ENTITIES" | null {
  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  return payload && (payload.sourceLaneType === "EXECUTIONS" || payload.sourceLaneType === "ENTITIES") ? payload.sourceLaneType : null;
}

export function resolveEffectDamageSignalAt(events: ICombatLogEvent[], index: number, playerAId: string): IDirectDamageSignal | null {
  const event = events[index];
  if (!event || event.eventType !== "DIRECT_DAMAGE") return null;
  const targetPlayerId = readTargetPlayerId(event);
  if (!targetPlayerId) return null;
  const trapContext = resolveTrapContextSignal(events, index, event.actorPlayerId);
  const payloadSourceCardId = readSourceCardId(event);
  const sourceCardId = payloadSourceCardId ?? resolveSourceCardId(events, index, event.actorPlayerId);
  const sourceSlotIndex = readSourceSlotIndex(event);
  const sourceLaneType = readSourceLaneType(event);
  if (!trapContext.fromTrap && !sourceCardId) return null;
  const markerA = events[index - 1]?.eventType;
  const markerB = events[index - 2]?.eventType;
  const comesFromAttack = markerA === "ATTACK_DECLARED" || markerA === "BATTLE_RESOLVED" || markerB === "ATTACK_DECLARED";
  if (comesFromAttack && !trapContext.fromTrap) return null;
  const needsBlockPhase = trapContext.fromTrap && (
    trapContext.trapAction === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" ||
    trapContext.trapAction === "NEGATE_OPPONENT_TRAP_AND_DESTROY" ||
    trapContext.trapAction === "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED"
  );
  const trapStartDelayMs = needsBlockPhase ? 980 : trapContext.fromTrap ? 760 : 0;
  return {
    id: event.id,
    towardsPlayer: targetPlayerId === playerAId,
    fromPlayerA: event.actorPlayerId === playerAId,
    sourceCardId,
    sourceSlotIndex,
    sourceLaneType,
    startDelayMs: trapStartDelayMs,
  };
}

export function resolveLatestEffectDamageSignal(events: ICombatLogEvent[], playerAId: string): IDirectDamageSignal | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const signal = resolveEffectDamageSignalAt(events, index, playerAId);
    if (signal) return signal;
  }
  return null;
}

export function resolveFallbackTrajectory(towardsPlayer: boolean, fromPlayerA: boolean): ITrajectory {
  const playerSource = { x: 440, y: 580 };
  const opponentSource = { x: 560, y: 420 };
  const playerHud = { x: 186, y: 835 };
  const opponentHud = { x: 814, y: 166 };
  const source = fromPlayerA ? playerSource : opponentSource;
  const target = towardsPlayer ? playerHud : opponentHud;
  return {
    source,
    target,
    control: {
      x: (source.x + target.x) / 2 + (towardsPlayer ? -28 : 28),
      y: (source.y + target.y) / 2 + (towardsPlayer ? 42 : -42),
    },
  };
}

function toOverlayPoint(root: HTMLDivElement, target: HTMLElement): IPoint {
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const x = ((targetRect.left + targetRect.width / 2 - rootRect.left) / Math.max(rootRect.width, 1)) * 1000;
  const y = ((targetRect.top + targetRect.height / 2 - rootRect.top) / Math.max(rootRect.height, 1)) * 1000;
  return { x, y };
}

export function resolveSourceFromBoard(root: HTMLDivElement, cardId: string, fromPlayerA: boolean): IPoint | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-board-card-id="${cardId}"]`));
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const ay = a.getBoundingClientRect().top;
    const by = b.getBoundingClientRect().top;
    return fromPlayerA ? by - ay : ay - by;
  });
  return toOverlayPoint(root, sorted[0]);
}

export function resolveSourceFromSlot(
  root: HTMLDivElement,
  isPlayerAActor: boolean,
  laneType: "EXECUTIONS" | "ENTITIES",
  slotIndex: number,
): IPoint | null {
  const node = root.querySelector<HTMLElement>(
    `[data-board-slot-side="${isPlayerAActor ? "player" : "opponent"}"][data-board-lane-type="${laneType}"][data-slot-index="${slotIndex}"]`,
  );
  if (!node) return null;
  return toOverlayPoint(root, node);
}
