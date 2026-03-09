// src/components/game/board/internal/combat-log-presentation/format-combat-log-event.ts - Texto descriptivo de cada evento para historial humano.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPlayerLabels } from "@/components/game/board/internal/combat-log-presentation/types";
import { readPayloadBoolean, readPayloadField, readPayloadNumber } from "@/components/game/board/internal/combat-log-presentation/payload-readers";
import { resolveActorName } from "@/components/game/board/internal/combat-log-presentation/banner-and-delta";

/**
 * Construye frase legible por humanos para una entrada del historial de combate.
 */
export function formatCombatLogEvent(event: ICombatLogEvent, labels: IPlayerLabels): string {
  const actor = resolveActorName(event.actorPlayerId, labels);
  const cardId = readPayloadField(event.payload, "cardId");
  switch (event.eventType) {
    case "TURN_STARTED": return `${actor} inicia turno.`;
    case "PHASE_CHANGED": return `${actor} cambia a fase ${event.phase}.`;
    case "ENERGY_GAINED": return `${actor} recupera energía.`;
    case "ATTACK_DECLARED": return `${actor} declara un ataque.`;
    case "DIRECT_DAMAGE": return `${actor} aplica daño directo.`;
    case "HEAL_APPLIED": return `${actor} recupera LP.`;
    case "TRAP_TRIGGERED": return `${actor} activa una trampa. (+20 EXP)`;
    case "CARD_TO_GRAVEYARD": return `${actor} envía carta al cementerio.`;
    case "CARD_TO_DESTROYED": return `${actor} destruye una carta.`;
    case "MANDATORY_ACTION_RESOLVED": return `${actor} resuelve acción obligatoria.`;
    case "FUSION_SUMMONED": return `${actor} invoca una fusión. (+10 EXP)`;
    case "AUTO_PHASE_ADVANCED": return `${actor} activa avance automático de fase.`;
    case "TURN_GUARD_SHOWN": return `${actor} recibe aviso de ayuda antes de avanzar fase.`;
    case "TURN_GUARD_CONFIRMED": return `${actor} confirma el avance de fase sugerido.`;
    case "TURN_GUARD_CANCELLED": return `${actor} cancela el avance de fase sugerido.`;
    case "CARD_PLAYED": return resolveCardPlayedMessage(event, actor, cardId);
    case "BATTLE_RESOLVED": return resolveBattleMessage(event, actor);
    case "STAT_BUFF_APPLIED": return (readPayloadNumber(event.payload, "amount") ?? 0) < 0
      ? `${actor} aplica reducción de estadísticas.`
      : `${actor} potencia estadísticas en campo.`;
    case "CARD_XP_GAINED": {
      const xpCardId = readPayloadField(event.payload, "cardId") ?? "carta desconocida";
      return `${actor} gana ${readPayloadNumber(event.payload, "amount") ?? 0} EXP con ${xpCardId}.`;
    }
    case "CARD_LEVEL_UP": {
      const levelCardId = readPayloadField(event.payload, "cardId") ?? "carta desconocida";
      const oldLevel = readPayloadNumber(event.payload, "oldLevel") ?? 0;
      const newLevel = readPayloadNumber(event.payload, "newLevel") ?? 0;
      return `${actor} sube ${levelCardId} de Lv ${oldLevel} a Lv ${newLevel}.`;
    }
    default: return `${actor} ejecuta una acción.`;
  }
}

function resolveCardPlayedMessage(event: ICombatLogEvent, actor: string, cardId: string | null): string {
  const cardType =
    typeof event.payload === "object" && event.payload !== null && "cardType" in event.payload
      ? String((event.payload as Record<string, unknown>).cardType)
      : "";
  const mode =
    typeof event.payload === "object" && event.payload !== null && "mode" in event.payload
      ? String((event.payload as Record<string, unknown>).mode)
      : "";
  const xpSuffix = cardType === "ENTITY" ? " (+10 EXP)" : cardType === "EXECUTION" && mode === "ACTIVATE" ? " (+20 EXP)" : "";
  return `${actor} juega carta ${cardId ?? "desconocida"}.${xpSuffix}`;
}

function resolveBattleMessage(event: ICombatLogEvent, actor: string): string {
  const attackerCardId = readPayloadField(event.payload, "attackerCardId");
  const defenderCardId = readPayloadField(event.payload, "defenderCardId");
  const attackerDestroyed = readPayloadBoolean(event.payload, "attackerDestroyed");
  const defenderDestroyed = readPayloadBoolean(event.payload, "defenderDestroyed");
  if (!defenderCardId && attackerCardId) return `${actor} impacta ataque directo con ${attackerCardId}. (+30 EXP)`;
  if (attackerCardId && defenderCardId && attackerDestroyed !== null && defenderDestroyed !== null) {
    if (attackerDestroyed && defenderDestroyed) return `${actor} ataca: empate, ambas cartas destruidas.`;
    if (!attackerDestroyed && defenderDestroyed) return `${actor} ataca y gana el atacante. (+25 EXP)`;
    if (attackerDestroyed && !defenderDestroyed) return `${actor} ataca y gana el defensor.`;
    return `${actor} ataca sin destrucciones.`;
  }
  return `${actor} resuelve combate.`;
}
