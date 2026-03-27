// src/components/game/board/ui/layers/BoardPlayersLayer.tsx - Renderiza HUDs de jugador/oponente y fan de mano rival con feedback contextual.
"use client";

import { IPlayer } from "@/core/entities/IPlayer";
import { OpponentHandFan } from "../OpponentHandFan";
import { PlayerHUD } from "../../PlayerHUD";

interface BoardPlayersLayerProps {
  player: IPlayer;
  opponent: IPlayer;
  isPlayerTurn: boolean;
  lastDamageTargetPlayerId: string | null;
  lastDamageAmount: number | null;
  lastDamageEventId: string | null;
  lastHealTargetPlayerId: string | null;
  lastHealAmount: number | null;
  lastHealEventId: string | null;
  playerAvatarUrl?: string | null;
  opponentAvatarUrl?: string | null;
  playerDialogueMessage?: string | null;
  opponentDialogueMessage?: string | null;
  phase: string;
  onAdvancePhase: () => void;
}

export function BoardPlayersLayer({
  player,
  opponent,
  isPlayerTurn,
  lastDamageTargetPlayerId,
  lastDamageAmount,
  lastDamageEventId,
  lastHealTargetPlayerId,
  lastHealAmount,
  lastHealEventId,
  playerAvatarUrl = null,
  opponentAvatarUrl = null,
  playerDialogueMessage = null,
  opponentDialogueMessage = null,
  phase,
  onAdvancePhase,
}: BoardPlayersLayerProps) {
  return (
    <>
      <OpponentHandFan hand={opponent.hand} />
      <PlayerHUD
        isOpponent={true}
        player={opponent}
        isActiveTurn={!isPlayerTurn}
        wasDamagedThisAction={lastDamageTargetPlayerId === opponent.id}
        damageAmount={lastDamageAmount}
        damagePulseKey={lastDamageEventId}
        wasHealedThisAction={lastHealTargetPlayerId === opponent.id}
        healAmount={lastHealAmount}
        healPulseKey={lastHealEventId}
        avatarUrl={opponentAvatarUrl}
        dialogueMessage={opponentDialogueMessage}
        containerClassName="!top-[clamp(0.35rem,1.1vh,0.9rem)]"
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
        avatarUrl={playerAvatarUrl}
        dialogueMessage={playerDialogueMessage}
        phase={phase}
        onAdvancePhase={onAdvancePhase}
      />
    </>
  );
}
