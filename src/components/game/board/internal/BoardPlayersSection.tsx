// src/components/game/board/internal/BoardPlayersSection.tsx - Muestra HUD de jugadores en desktop y mobile.
"use client";

import { PlayerHUD } from "@/components/game/board/PlayerHUD";
import { BoardMobileEnergyBadge } from "@/components/game/board/internal/BoardMobileEnergyBadge";
import { useBoardMobileHudLayout } from "@/components/game/board/internal/use-board-mobile-hud-layout";
import { BoardMobilePhaseControls } from "@/components/game/board/ui/layout/BoardMobilePhaseControls";
import { BoardPlayersLayer } from "@/components/game/board/ui/layers/BoardPlayersLayer";
import { IBoardViewSectionProps } from "@/components/game/board/internal/board-view-types";

export function BoardPlayersSection({
  board,
  screen,
  isMobile,
  player,
  opponent,
  playerAvatarUrl,
  opponentAvatarUrl,
}: IBoardViewSectionProps) {
  const mobileHudLayout = useBoardMobileHudLayout();
  if (screen.isResultVisible) return null;

  if (!isMobile) {
    return (
      <BoardPlayersLayer
        player={player}
        opponent={opponent}
        isPlayerTurn={board.isPlayerTurn}
        lastDamageTargetPlayerId={board.lastDamageTargetPlayerId}
        lastDamageAmount={board.lastDamageAmount}
        lastDamageEventId={board.lastDamageEventId}
        lastHealTargetPlayerId={board.lastHealTargetPlayerId}
        lastHealAmount={board.lastHealAmount}
        lastHealEventId={board.lastHealEventId}
        lastEnergyTargetPlayerId={board.lastEnergyTargetPlayerId}
        lastEnergyAmount={board.lastEnergyAmount}
        lastEnergyEventId={board.lastEnergyEventId}
        lastEnergyLossTargetPlayerId={board.lastEnergyLossTargetPlayerId}
        lastEnergyLossAmount={board.lastEnergyLossAmount}
        lastEnergyLossEventId={board.lastEnergyLossEventId}
        playerAvatarUrl={playerAvatarUrl}
        opponentAvatarUrl={opponentAvatarUrl}
        playerDialogueMessage={screen.narration.hudDialogueByPlayerId[player.id] ?? null}
        opponentDialogueMessage={screen.narration.hudDialogueByPlayerId[opponent.id] ?? null}
        phase={board.gameState.phase}
        onAdvancePhase={board.advancePhase}
      />
    );
  }

  return (
    <>
      <PlayerHUD
        isOpponent={true}
        player={opponent}
        isActiveTurn={!board.isPlayerTurn}
        wasDamagedThisAction={board.lastDamageTargetPlayerId === opponent.id}
        damageAmount={board.lastDamageAmount}
        damagePulseKey={board.lastDamageEventId}
        wasHealedThisAction={board.lastHealTargetPlayerId === opponent.id}
        healAmount={board.lastHealAmount}
        healPulseKey={board.lastHealEventId}
        wasEnergyGainedThisAction={board.lastEnergyTargetPlayerId === opponent.id}
        energyAmount={board.lastEnergyAmount}
        energyPulseKey={board.lastEnergyEventId}
        wasEnergyLostThisAction={board.lastEnergyLossTargetPlayerId === opponent.id}
        energyLossAmount={board.lastEnergyLossAmount}
        energyLossPulseKey={board.lastEnergyLossEventId}
        avatarUrl={opponentAvatarUrl}
        dialogueMessage={screen.narration.hudDialogueByPlayerId[opponent.id] ?? null}
        containerClassName="!top-0 !right-0 !z-[280] !w-[clamp(11.8rem,35vw,16.4rem)] !h-[clamp(5.4rem,10.2vh,6.9rem)]"
        containerStyle={{ top: `${mobileHudLayout.opponentHudTopPx}px` }}
        showPhaseControls={false}
      />
      <PlayerHUD
        isOpponent={false}
        player={player}
        isActiveTurn={board.isPlayerTurn}
        wasDamagedThisAction={board.lastDamageTargetPlayerId === player.id}
        damageAmount={board.lastDamageAmount}
        damagePulseKey={board.lastDamageEventId}
        wasHealedThisAction={board.lastHealTargetPlayerId === player.id}
        healAmount={board.lastHealAmount}
        healPulseKey={board.lastHealEventId}
        wasEnergyGainedThisAction={board.lastEnergyTargetPlayerId === player.id}
        energyAmount={board.lastEnergyAmount}
        energyPulseKey={board.lastEnergyEventId}
        wasEnergyLostThisAction={board.lastEnergyLossTargetPlayerId === player.id}
        energyLossAmount={board.lastEnergyLossAmount}
        energyLossPulseKey={board.lastEnergyLossEventId}
        avatarUrl={playerAvatarUrl}
        dialogueMessage={screen.narration.hudDialogueByPlayerId[player.id] ?? null}
        phase={board.gameState.phase}
        onAdvancePhase={board.advancePhase}
        containerClassName="!bottom-0 !left-0 !right-auto !z-[280] !justify-end !w-[clamp(11.8rem,36vw,16.8rem)] !h-[clamp(5.6rem,10.5vh,7.1rem)]"
        containerStyle={{ bottom: `${mobileHudLayout.playerHudBottomPx}px` }}
        showPhaseControls={false}
        showEnergy={false}
      />
      <BoardMobilePhaseControls
        phase={board.gameState.phase}
        isPlayerTurn={board.isPlayerTurn}
        hasWinner={Boolean(board.winnerPlayerId)}
        onAdvancePhase={board.advancePhase}
        dockLeftPx={mobileHudLayout.dockLeftPx}
        bottomPx={mobileHudLayout.controlsBottomPx}
      />
      <BoardMobileEnergyBadge
        currentEnergy={player.currentEnergy}
        maxEnergy={player.maxEnergy}
        isPlayerTurn={board.isPlayerTurn}
        dockLeftPx={mobileHudLayout.dockLeftPx}
        bottomPx={mobileHudLayout.energyBottomPx}
      />
    </>
  );
}
