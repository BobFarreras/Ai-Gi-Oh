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
  lastEnergyTargetPlayerId: string | null;
  lastEnergyAmount: number | null;
  lastEnergyEventId: string | null;
  lastEnergyLossTargetPlayerId: string | null;
  lastEnergyLossAmount: number | null;
  lastEnergyLossEventId: string | null;
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
  lastEnergyTargetPlayerId,
  lastEnergyAmount,
  lastEnergyEventId,
  lastEnergyLossTargetPlayerId,
  lastEnergyLossAmount,
  lastEnergyLossEventId,
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
        wasEnergyGainedThisAction={lastEnergyTargetPlayerId === opponent.id}
        energyAmount={lastEnergyAmount}
        energyPulseKey={lastEnergyEventId}
        wasEnergyLostThisAction={lastEnergyLossTargetPlayerId === opponent.id}
        energyLossAmount={lastEnergyLossAmount}
        energyLossPulseKey={lastEnergyLossEventId}
        avatarUrl={opponentAvatarUrl}
        dialogueMessage={opponentDialogueMessage}
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
        wasEnergyGainedThisAction={lastEnergyTargetPlayerId === player.id}
        energyAmount={lastEnergyAmount}
        energyPulseKey={lastEnergyEventId}
        wasEnergyLostThisAction={lastEnergyLossTargetPlayerId === player.id}
        energyLossAmount={lastEnergyLossAmount}
        energyLossPulseKey={lastEnergyLossEventId}
        avatarUrl={playerAvatarUrl}
        dialogueMessage={playerDialogueMessage}
        phase={phase}
        onAdvancePhase={onAdvancePhase}
      />
    </>
  );
}
