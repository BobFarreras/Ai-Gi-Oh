// src/core/use-cases/game-engine/actions/play-card.ts - Juega cartas desde la mano validando reglas de turno, energía y zonas.
import { BattleMode, IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertMainPhaseActionAllowed } from "@/core/use-cases/game-engine/actions/internal/action-preconditions";
import {
  buildPlayerAfterCardPlay,
  createPlayedBoardEntity,
  resolveValidatedPlayMode,
} from "@/core/use-cases/game-engine/actions/internal/play-card-resolution";
import { resolveReactiveTrapEvent } from "@/core/use-cases/game-engine/effects/internal/trap-trigger-registry";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { drawTopDeckCard, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function matchesHandCardReference(card: IPlayer["hand"][number], reference: string): boolean {
  return card.runtimeId === reference || card.id === reference;
}

export function playCard(state: GameState, playerId: string, cardId: string, mode: BattleMode): GameState {
  assertMainPhaseActionAllowed(state, playerId);

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const cardIndex = player.hand.findIndex((card) => matchesHandCardReference(card, cardId));

  if (cardIndex === -1) {
    throw new NotFoundError("La carta no está en la mano.");
  }

  const card = player.hand[cardIndex];
  let resolvedMode = mode;

  if (player.currentEnergy < card.cost) {
    throw new ValidationError("Energía insuficiente.");
  }

  resolvedMode = resolveValidatedPlayMode(state, player, card.type, mode);

  const boardEntity = createPlayedBoardEntity(state, card, resolvedMode);
  const updatedPlayer: IPlayer = buildPlayerAfterCardPlay(player, card, boardEntity, cardIndex);

  // Caja de Herramientas: al invocar (no SET) una entity con la pasiva, su dueño roba 1 carta.
  const drawsOnSummon =
    card.type === "ENTITY" && resolvedMode !== "SET" && card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.DRAW_ON_SUMMON;
  const playerAfterSummon = drawsOnSummon ? drawTopDeckCard(updatedPlayer) : updatedPlayer;

  const nextState = {
    ...state,
    hasNormalSummonedThisTurn: card.type === "ENTITY" ? true : state.hasNormalSummonedThisTurn,
    playerA: isPlayerA ? playerAfterSummon : opponent,
    playerB: isPlayerA ? opponent : playerAfterSummon,
  };

  const withPlayLog = appendCombatLogEvent(nextState, playerId, "CARD_PLAYED", {
    cardId: card.id,
    cardType: card.type,
    mode: resolvedMode,
    effectAction: card.effect?.action ?? null,
    // Caja de Herramientas: marca el robo al invocar para que el VFX de robo (deck→mano) se dispare.
    ...(drawsOnSummon ? { drewOnSummon: true } : {}),
  });
  if (card.type === "ENTITY" && resolvedMode === "SET") {
    return resolveReactiveTrapEvent(withPlayLog, opponent.id, {
      type: "ENTITY_SET_PLAYED",
      context: { summonedPlayerId: playerId, summonedInstanceId: boardEntity.instanceId },
    });
  }
  return withPlayLog;
}
