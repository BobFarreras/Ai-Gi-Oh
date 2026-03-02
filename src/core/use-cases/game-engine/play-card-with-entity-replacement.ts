import { BattleMode, IPlayer } from "../../entities/IPlayer";
import { GameRuleError } from "../../errors/GameRuleError";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { assignPlayers, getPlayerPair } from "./player-utils";
import { GameState } from "./types";
import { playCard } from "./play-card";

export function playCardWithEntityReplacement(
  state: GameState,
  playerId: string,
  cardId: string,
  mode: BattleMode,
  sacrificedEntityInstanceId: string,
): GameState {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria de inicio de turno antes de jugar cartas.");
  }

  if (state.activePlayerId !== playerId) {
    throw new GameRuleError("No es tu turno.");
  }

  if (state.phase !== "MAIN_1") {
    throw new GameRuleError("Solo puedes jugar cartas en la fase de despliegue.");
  }

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const card = player.hand.find((currentCard) => currentCard.id === cardId);

  if (!card) {
    throw new NotFoundError("La carta no está en la mano.");
  }

  if (card.type !== "ENTITY") {
    throw new ValidationError("Solo puedes reemplazar entidades para invocar otra entidad.");
  }

  if (mode !== "ATTACK" && mode !== "DEFENSE") {
    throw new ValidationError("Modo inválido para una entidad.");
  }

  if (player.activeEntities.length < 3) {
    throw new ValidationError("Tu zona de entidades no está llena; no necesitas reemplazo.");
  }

  const sacrificedEntity = player.activeEntities.find((entity) => entity.instanceId === sacrificedEntityInstanceId);
  if (!sacrificedEntity) {
    throw new NotFoundError("La entidad seleccionada para reemplazo no existe en tu campo.");
  }

  const updatedPlayerAfterSacrifice: IPlayer = {
    ...player,
    activeEntities: player.activeEntities.filter((entity) => entity.instanceId !== sacrificedEntityInstanceId),
    graveyard: [...player.graveyard, sacrificedEntity.card],
  };

  const stateAfterSacrifice = assignPlayers(state, updatedPlayerAfterSacrifice, opponent, isPlayerA);
  return playCard(stateAfterSacrifice, playerId, cardId, mode);
}

