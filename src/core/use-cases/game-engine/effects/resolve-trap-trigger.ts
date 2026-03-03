import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { TrapTrigger } from "@/core/entities/ICard";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { assignPlayers, getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function findTriggeredTrap(player: IPlayer, trigger: TrapTrigger): IBoardEntity | null {
  return (
    player.activeExecutions.find(
      (entity) => entity.card.type === "TRAP" && entity.mode === "SET" && entity.card.trigger === trigger,
    ) ?? null
  );
}

function resolveTrapEffect(player: IPlayer, opponent: IPlayer, trap: IBoardEntity): { player: IPlayer; opponent: IPlayer; damage: number } {
  if (!trap.card.effect || trap.card.effect.action !== "DAMAGE") {
    return { player, opponent, damage: 0 };
  }

  if (trap.card.effect.target === "PLAYER") {
    return {
      player: { ...player, healthPoints: Math.max(0, player.healthPoints - trap.card.effect.value) },
      opponent,
      damage: trap.card.effect.value,
    };
  }

  return {
    player,
    opponent: { ...opponent, healthPoints: Math.max(0, opponent.healthPoints - trap.card.effect.value) },
    damage: trap.card.effect.value,
  };
}

export function resolveTrapTrigger(state: GameState, reactivePlayerId: string, trigger: TrapTrigger): GameState {
  const { player, opponent, isPlayerA } = getPlayerPair(state, reactivePlayerId);
  const trap = findTriggeredTrap(player, trigger);
  if (!trap) {
    return state;
  }

  const playerAfterTrapUse: IPlayer = {
    ...player,
    activeExecutions: player.activeExecutions.filter((entity) => entity.instanceId !== trap.instanceId),
    graveyard: [...player.graveyard, trap.card],
  };

  const resolved = resolveTrapEffect(playerAfterTrapUse, opponent, trap);
  const baseState = assignPlayers(state, resolved.player, resolved.opponent, isPlayerA);

  let withLogs = appendCombatLogEvent(baseState, reactivePlayerId, "TRAP_TRIGGERED", {
    trapCardId: trap.card.id,
    trigger,
  });
  withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "CARD_TO_GRAVEYARD", {
    cardId: trap.card.id,
    ownerPlayerId: reactivePlayerId,
    from: "EXECUTION_ZONE",
  });

  if (resolved.damage > 0 && trap.card.effect?.action === "DAMAGE") {
    const targetPlayerId = trap.card.effect.target === "OPPONENT" ? opponent.id : player.id;
    withLogs = appendCombatLogEvent(withLogs, reactivePlayerId, "DIRECT_DAMAGE", {
      targetPlayerId,
      amount: resolved.damage,
    });
  }

  return withLogs;
}
