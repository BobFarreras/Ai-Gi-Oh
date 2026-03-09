// src/components/game/board/ui/internal/banner/banner-message-policy.ts - Resuelve la política latest-wins para mensajes del banner central del combate.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { buildBannerMessage } from "../../../internal/combatLogPresentation";

export interface IBattleBannerMessage {
  id: string;
  left: string;
  right: string;
}

interface IResolveLatestBannerMessageParams {
  events: ICombatLogEvent[];
  labels: { playerAId: string; playerAName: string; playerBId: string; playerBName: string };
  externalBannerSignal?: IBattleBannerMessage | null;
}

const CRITICAL_EVENT_TYPES: ICombatLogEvent["eventType"][] = [
  "TURN_STARTED",
  "PHASE_CHANGED",
  "AUTO_PHASE_ADVANCED",
  "TURN_GUARD_SHOWN",
  "TURN_GUARD_CONFIRMED",
  "TURN_GUARD_CANCELLED",
];

export function resolveLatestBannerMessage({
  events,
  labels,
  externalBannerSignal = null,
}: IResolveLatestBannerMessageParams): IBattleBannerMessage | null {
  const eventMessages: IBattleBannerMessage[] = events
    .filter((event) => CRITICAL_EVENT_TYPES.includes(event.eventType))
    .map((event) => ({
      id: event.id,
      ...(buildBannerMessage(event, labels) ?? { left: "Evento", right: "de batalla" }),
    }));
  const merged = externalBannerSignal ? [...eventMessages, externalBannerSignal] : eventMessages;
  return merged.length > 0 ? merged[merged.length - 1] : null;
}

