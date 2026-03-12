// src/core/use-cases/game-engine/actions/play-card-with-zone-replacement.ts - Reemplaza una carta ocupando su misma zona (entidades o ejecuciones) y luego juega la carta seleccionada.
import { CardType } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertMainPhaseActionAllowed } from "@/core/use-cases/game-engine/actions/internal/action-preconditions";
import { playCard } from "@/core/use-cases/game-engine/actions/play-card";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export type ReplacementZoneType = "ENTITIES" | "EXECUTIONS";

interface IReplacementZoneRules {
  zone: ReplacementZoneType;
  minimumOccupiedSlots: number;
  acceptedCardTypes: ReadonlyArray<CardType>;
  invalidCardMessage: string;
  zoneFullMessage: string;
  zoneNotFullMessage: string;
  replacementReason: "ENTITY_REPLACEMENT" | "EXECUTION_REPLACEMENT";
}

const ZONE_RULES: Record<ReplacementZoneType, IReplacementZoneRules> = {
  ENTITIES: {
    zone: "ENTITIES",
    minimumOccupiedSlots: 3,
    acceptedCardTypes: ["ENTITY"],
    invalidCardMessage: "Solo puedes reemplazar entidades para invocar otra entidad.",
    zoneFullMessage: "Tu zona de entidades no está llena; no necesitas reemplazo.",
    zoneNotFullMessage: "La entidad seleccionada para reemplazo no existe en tu campo.",
    replacementReason: "ENTITY_REPLACEMENT",
  },
  EXECUTIONS: {
    zone: "EXECUTIONS",
    minimumOccupiedSlots: 3,
    acceptedCardTypes: ["EXECUTION", "TRAP"],
    invalidCardMessage: "Solo puedes reemplazar ejecuciones para jugar una ejecución o trampa.",
    zoneFullMessage: "Tu zona de ejecuciones no está llena; no necesitas reemplazo.",
    zoneNotFullMessage: "La ejecución seleccionada para reemplazo no existe en tu campo.",
    replacementReason: "EXECUTION_REPLACEMENT",
  },
};

function resolveZoneEntities(player: IPlayer, zone: ReplacementZoneType): IBoardEntity[] {
  return zone === "ENTITIES" ? player.activeEntities : player.activeExecutions;
}

function removeFromZone(player: IPlayer, zone: ReplacementZoneType, instanceId: string): IPlayer {
  if (zone === "ENTITIES") {
    return { ...player, activeEntities: player.activeEntities.filter((entity) => entity.instanceId !== instanceId) };
  }
  return { ...player, activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== instanceId) };
}

export function playCardWithZoneReplacement(
  state: GameState,
  playerId: string,
  cardId: string,
  mode: BattleMode,
  sacrificedEntityInstanceId: string,
  zone: ReplacementZoneType,
): GameState {
  assertMainPhaseActionAllowed(state, playerId);

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const card = player.hand.find((currentCard) => currentCard.runtimeId === cardId || currentCard.id === cardId);
  if (!card) throw new NotFoundError("La carta no está en la mano.");

  const rules = ZONE_RULES[zone];
  if (!rules.acceptedCardTypes.includes(card.type)) throw new ValidationError(rules.invalidCardMessage);

  const zoneEntities = resolveZoneEntities(player, zone);
  if (zoneEntities.length < rules.minimumOccupiedSlots) throw new ValidationError(rules.zoneFullMessage);

  const sacrificedEntity = zoneEntities.find((entity) => entity.instanceId === sacrificedEntityInstanceId);
  if (!sacrificedEntity) throw new NotFoundError(rules.zoneNotFullMessage);

  const playerAfterSacrifice = removeFromZone(player, zone, sacrificedEntityInstanceId);
  const updatedPlayerAfterSacrifice = { ...playerAfterSacrifice, graveyard: [...playerAfterSacrifice.graveyard, sacrificedEntity.card] };
  const stateAfterSacrifice = appendCombatLogEvent(
    assignPlayers(state, updatedPlayerAfterSacrifice, opponent, isPlayerA),
    playerId,
    "CARD_TO_GRAVEYARD",
    { cardId: sacrificedEntity.card.id, ownerPlayerId: playerId, from: "BATTLEFIELD", reason: rules.replacementReason },
  );
  return playCard(stateAfterSacrifice, playerId, cardId, mode);
}
