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
      return `${actor} juega carta ${cardId ?? "desconocida"}.`;
    case "ATTACK_DECLARED":
      return `${actor} declara un ataque.`;
    case "BATTLE_RESOLVED":
      return `${actor} resuelve combate.`;
    case "DIRECT_DAMAGE":
      return `${actor} aplica daño directo.`;
    case "CARD_TO_GRAVEYARD":
      return `${actor} envía carta al cementerio.`;
    case "MANDATORY_ACTION_RESOLVED":
      return `${actor} resuelve acción obligatoria.`;
    case "FUSION_SUMMONED":
      return `${actor} invoca una fusión.`;
    default:
      return `${actor} ejecuta una acción.`;
  }
}
