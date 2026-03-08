// src/components/game/board/internal/combatLogPresentation.ts - Formatea mensajes y deltas del combatLog para paneles y banners del tablero.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface IPlayerLabels {
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
}

export function resolveActorName(playerId: string, labels: IPlayerLabels): string {
  if (playerId === labels.playerAId) {
    return labels.playerAName;
  }

  if (playerId === labels.playerBId) {
    return labels.playerBName;
  }

  return "Sistema";
}

function readPayloadField(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export function extractEventCardIds(event: ICombatLogEvent): string[] {
  const cardId = readPayloadField(event.payload, "cardId");
  const attackerCard = readPayloadField(event.payload, "attackerCardId");
  const defenderCard = readPayloadField(event.payload, "defenderCardId");
  return [cardId, attackerCard, defenderCard].filter((value): value is string => Boolean(value));
}

function readPayloadBoolean(payload: unknown, key: string): boolean | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : null;
}

export function extractEventAmount(event: ICombatLogEvent): number | null {
  if (typeof event.payload !== "object" || event.payload === null || !("amount" in event.payload)) {
    return null;
  }
  const value = (event.payload as Record<string, unknown>).amount;
  return typeof value === "number" ? value : null;
}

export function formatEventDelta(event: ICombatLogEvent): { text: string; tone: "red" | "blue" | "amber" } | null {
  const amount = extractEventAmount(event);
  if (amount === null) return null;

  if (event.eventType === "DIRECT_DAMAGE") {
    return { text: `-${amount} LP`, tone: "red" };
  }
  if (event.eventType === "HEAL_APPLIED") {
    return { text: `+${amount} LP`, tone: "blue" };
  }
  if (event.eventType === "STAT_BUFF_APPLIED") {
    const stat =
      typeof event.payload === "object" && event.payload !== null && "stat" in event.payload
        ? String((event.payload as Record<string, unknown>).stat)
        : "STAT";
    const sign = amount < 0 ? "-" : "+";
    return { text: `${sign}${Math.abs(amount)} ${stat}`, tone: "amber" };
  }
  if (event.eventType === "CARD_XP_GAINED") {
    return { text: `+${amount} EXP`, tone: "amber" };
  }
  return null;
}

export function buildBannerMessage(event: ICombatLogEvent, labels: IPlayerLabels): { left: string; right: string } | null {
  const actor = resolveActorName(event.actorPlayerId, labels);

  if (event.eventType === "TURN_STARTED") {
    return { left: "Cambio de turno", right: actor };
  }

  if (event.eventType === "PHASE_CHANGED") {
    const toPhase =
      typeof event.payload === "object" && event.payload !== null && "toPhase" in event.payload
        ? String((event.payload as Record<string, unknown>).toPhase)
        : event.phase;
    return { left: actor, right: `Fase ${toPhase === "MAIN_1" ? "Despliegue" : "Combate"}` };
  }
  if (event.eventType === "AUTO_PHASE_ADVANCED") {
    return { left: "Modo Automático", right: "Avance de fase" };
  }
  if (event.eventType === "TURN_GUARD_SHOWN") {
    return { left: "Ayuda de turno", right: "Confirmación" };
  }
  if (event.eventType === "TURN_GUARD_CONFIRMED") {
    return { left: "Ayuda de turno", right: "Continuar" };
  }
  if (event.eventType === "TURN_GUARD_CANCELLED") {
    return { left: "Ayuda de turno", right: "Volver" };
  }

  return null;
}

export function formatCombatLogEvent(event: ICombatLogEvent, labels: IPlayerLabels): string {
  const actor = resolveActorName(event.actorPlayerId, labels);
  const cardId = readPayloadField(event.payload, "cardId");

  switch (event.eventType) {
    case "TURN_STARTED":
      return `${actor} inicia turno.`;
    case "PHASE_CHANGED":
      return `${actor} cambia a fase ${event.phase}.`;
    case "ENERGY_GAINED":
      return `${actor} recupera energía.`;
    case "CARD_PLAYED":
      {
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
    case "ATTACK_DECLARED":
      return `${actor} declara un ataque.`;
    case "BATTLE_RESOLVED":
      {
        const attackerCardId = readPayloadField(event.payload, "attackerCardId");
        const defenderCardId = readPayloadField(event.payload, "defenderCardId");
        const attackerDestroyed = readPayloadBoolean(event.payload, "attackerDestroyed");
        const defenderDestroyed = readPayloadBoolean(event.payload, "defenderDestroyed");
        const isDirect = !defenderCardId;

        if (isDirect && attackerCardId) {
          return `${actor} impacta ataque directo con ${attackerCardId}. (+30 EXP)`;
        }

        if (attackerCardId && defenderCardId && attackerDestroyed !== null && defenderDestroyed !== null) {
          if (attackerDestroyed && defenderDestroyed) {
            return `${actor} ataca: empate, ambas cartas destruidas.`;
          }
          if (!attackerDestroyed && defenderDestroyed) {
            return `${actor} ataca y gana el atacante. (+25 EXP)`;
          }
          if (attackerDestroyed && !defenderDestroyed) {
            return `${actor} ataca y gana el defensor.`;
          }
          return `${actor} ataca sin destrucciones.`;
        }

        return `${actor} resuelve combate.`;
      }
    case "DIRECT_DAMAGE":
      return `${actor} aplica daño directo.`;
    case "HEAL_APPLIED":
      return `${actor} recupera LP.`;
    case "STAT_BUFF_APPLIED":
      {
        const amount =
          typeof event.payload === "object" && event.payload !== null && "amount" in event.payload
            ? Number((event.payload as Record<string, unknown>).amount)
            : 0;
        return amount < 0 ? `${actor} aplica reducción de estadísticas.` : `${actor} potencia estadísticas en campo.`;
      }
    case "TRAP_TRIGGERED":
      return `${actor} activa una trampa. (+20 EXP)`;
    case "CARD_TO_GRAVEYARD":
      return `${actor} envía carta al cementerio.`;
    case "CARD_TO_DESTROYED":
      return `${actor} destruye una carta.`;
    case "MANDATORY_ACTION_RESOLVED":
      return `${actor} resuelve acción obligatoria.`;
    case "FUSION_SUMMONED":
      return `${actor} invoca una fusión. (+10 EXP)`;
    case "CARD_XP_GAINED":
      {
        const xpCardId = readPayloadField(event.payload, "cardId") ?? "carta desconocida";
        const amount =
          typeof event.payload === "object" && event.payload !== null && "amount" in event.payload
            ? Number((event.payload as Record<string, unknown>).amount)
            : null;
        return `${actor} gana ${amount ?? 0} EXP con ${xpCardId}.`;
      }
    case "CARD_LEVEL_UP":
      {
        const levelCardId = readPayloadField(event.payload, "cardId") ?? "carta desconocida";
        const oldLevel =
          typeof event.payload === "object" && event.payload !== null && "oldLevel" in event.payload
            ? Number((event.payload as Record<string, unknown>).oldLevel)
            : 0;
        const newLevel =
          typeof event.payload === "object" && event.payload !== null && "newLevel" in event.payload
            ? Number((event.payload as Record<string, unknown>).newLevel)
            : 0;
        return `${actor} sube ${levelCardId} de Lv ${oldLevel} a Lv ${newLevel}.`;
      }
    case "AUTO_PHASE_ADVANCED":
      return `${actor} activa avance automático de fase.`;
    case "TURN_GUARD_SHOWN":
      return `${actor} recibe aviso de ayuda antes de avanzar fase.`;
    case "TURN_GUARD_CONFIRMED":
      return `${actor} confirma el avance de fase sugerido.`;
    case "TURN_GUARD_CANCELLED":
      return `${actor} cancela el avance de fase sugerido.`;
    default:
      return `${actor} ejecuta una acción.`;
  }
}
