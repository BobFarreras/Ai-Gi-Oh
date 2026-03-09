// src/components/game/board/ui/internal/combat-log-row/presentation.ts - Descripción breve del módulo.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export function actorPalette(actorPlayerId: string, playerAId: string): { tone: string; border: string } {
  if (actorPlayerId === playerAId) {
    return {
      tone: "text-cyan-200 bg-cyan-500/15 border-cyan-400/40",
      border: "border-cyan-500/35",
    };
  }
  return {
    tone: "text-red-200 bg-red-500/15 border-red-400/40",
    border: "border-red-500/35",
  };
}

export function readPayloadString(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export function readPayloadBoolean(payload: unknown, key: string): boolean | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : null;
}

export function resolveWinnerText(
  event: ICombatLogEvent,
  attackerName: string,
  defenderName: string,
): string | null {
  const attackerDestroyed = readPayloadBoolean(event.payload, "attackerDestroyed");
  const defenderDestroyed = readPayloadBoolean(event.payload, "defenderDestroyed");
  if (event.eventType !== "BATTLE_RESOLVED" || attackerDestroyed === null || defenderDestroyed === null) return null;
  if (attackerDestroyed && defenderDestroyed) return "Empate";
  if (!attackerDestroyed && defenderDestroyed) return `Gana ${attackerName}`;
  if (attackerDestroyed && !defenderDestroyed) return `Gana ${defenderName}`;
  return "Sin destrucciones";
}

