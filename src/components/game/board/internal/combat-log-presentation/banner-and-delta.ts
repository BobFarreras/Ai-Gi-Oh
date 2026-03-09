// src/components/game/board/internal/combat-log-presentation/banner-and-delta.ts - Mensajes breves de banner y delta visual por evento.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPlayerLabels } from "@/components/game/board/internal/combat-log-presentation/types";
import { extractEventAmount } from "@/components/game/board/internal/combat-log-presentation/payload-readers";

export function resolveActorName(playerId: string, labels: IPlayerLabels): string {
  if (playerId === labels.playerAId) return labels.playerAName;
  if (playerId === labels.playerBId) return labels.playerBName;
  return "Sistema";
}

export function formatEventDelta(event: ICombatLogEvent): { text: string; tone: "red" | "blue" | "amber" } | null {
  const amount = extractEventAmount(event);
  if (amount === null) return null;
  if (event.eventType === "DIRECT_DAMAGE") return { text: `-${amount} LP`, tone: "red" };
  if (event.eventType === "HEAL_APPLIED") return { text: `+${amount} LP`, tone: "blue" };
  if (event.eventType === "CARD_XP_GAINED") return { text: `+${amount} EXP`, tone: "amber" };
  if (event.eventType !== "STAT_BUFF_APPLIED") return null;
  const stat =
    typeof event.payload === "object" && event.payload !== null && "stat" in event.payload
      ? String((event.payload as Record<string, unknown>).stat)
      : "STAT";
  const sign = amount < 0 ? "-" : "+";
  return { text: `${sign}${Math.abs(amount)} ${stat}`, tone: "amber" };
}

export function buildBannerMessage(event: ICombatLogEvent, labels: IPlayerLabels): { left: string; right: string } | null {
  const actor = resolveActorName(event.actorPlayerId, labels);
  if (event.eventType === "TURN_STARTED") return { left: "Cambio de turno", right: actor };
  if (event.eventType === "AUTO_PHASE_ADVANCED") return { left: "Modo Automático", right: "Avance de fase" };
  if (event.eventType === "TURN_GUARD_SHOWN") return { left: "Ayuda de turno", right: "Confirmación" };
  if (event.eventType === "TURN_GUARD_CONFIRMED") return { left: "Ayuda de turno", right: "Continuar" };
  if (event.eventType === "TURN_GUARD_CANCELLED") return { left: "Ayuda de turno", right: "Volver" };
  if (event.eventType !== "PHASE_CHANGED") return null;
  const toPhase =
    typeof event.payload === "object" && event.payload !== null && "toPhase" in event.payload
      ? String((event.payload as Record<string, unknown>).toPhase)
      : event.phase;
  return { left: actor, right: `Fase ${toPhase === "MAIN_1" ? "Despliegue" : "Combate"}` };
}
