"use client";

import { IPlayer } from "@/core/entities/IPlayer";
import { OpponentHandFan } from "../OpponentHandFan";
import { PlayerHUD } from "../../PlayerHUD";

interface BoardPlayersLayerProps {
  player: IPlayer;
  opponent: IPlayer;
  isPlayerTurn: boolean;
  opponentDifficulty: string;
  lastDamageTargetPlayerId: string | null;
  lastDamageAmount: number | null;
  lastDamageEventId: string | null;
  lastHealTargetPlayerId: string | null;
  lastHealAmount: number | null;
  lastHealEventId: string | null;
}

export function BoardPlayersLayer({
  player,
  opponent,
  isPlayerTurn,
  opponentDifficulty,
  lastDamageTargetPlayerId,
  lastDamageAmount,
  lastDamageEventId,
  lastHealTargetPlayerId,
  lastHealAmount,
  lastHealEventId,
}: BoardPlayersLayerProps) {
  return (
    <>
      <OpponentHandFan hand={opponent.hand} />
      <PlayerHUD
        isOpponent={true}
        player={opponent}
        isActiveTurn={!isPlayerTurn}
        badgeText={`Dificultad ${opponentDifficulty}`}
        wasDamagedThisAction={lastDamageTargetPlayerId === opponent.id}
        damageAmount={lastDamageAmount}
        damagePulseKey={lastDamageEventId}
        wasHealedThisAction={lastHealTargetPlayerId === opponent.id}
        healAmount={lastHealAmount}
        healPulseKey={lastHealEventId}
      />
      <PlayerHUD
        isOpponent={false}
        player={player}
        isActiveTurn={isPlayerTurn}
        wasDamagedThisAction={lastDamageTargetPlayerId === player.id}
        damageAmount={lastDamageAmount}
        damagePulseKey={lastDamageEventId}
        wasHealedThisAction={lastHealTargetPlayerId === player.id}
        healAmount={lastHealAmount}
        healPulseKey={lastHealEventId}
      />
    </>
  );
}
