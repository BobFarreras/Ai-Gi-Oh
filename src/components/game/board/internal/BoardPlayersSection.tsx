// src/components/game/board/internal/BoardPlayersSection.tsx - Muestra HUD de jugadores en desktop y mobile.
import { PlayerHUD } from "@/components/game/board/PlayerHUD";
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
  if (screen.isResultVisible) return null;

  if (!isMobile) {
    return (
      <BoardPlayersLayer
        player={player}
        opponent={opponent}
        isPlayerTurn={board.isPlayerTurn}
        opponentDifficulty={board.opponentDifficulty}
        lastDamageTargetPlayerId={board.lastDamageTargetPlayerId}
        lastDamageAmount={board.lastDamageAmount}
        lastDamageEventId={board.lastDamageEventId}
        lastHealTargetPlayerId={board.lastHealTargetPlayerId}
        lastHealAmount={board.lastHealAmount}
        lastHealEventId={board.lastHealEventId}
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
        badgeText={`Dificultad ${board.opponentDifficulty}`}
        wasDamagedThisAction={board.lastDamageTargetPlayerId === opponent.id}
        damageAmount={board.lastDamageAmount}
        damagePulseKey={board.lastDamageEventId}
        wasHealedThisAction={board.lastHealTargetPlayerId === opponent.id}
        healAmount={board.lastHealAmount}
        healPulseKey={board.lastHealEventId}
        avatarUrl={opponentAvatarUrl}
        dialogueMessage={screen.narration.hudDialogueByPlayerId[opponent.id] ?? null}
        containerClassName="!top-0 !right-0 !z-[280] !w-[clamp(11.8rem,35vw,16.4rem)] !h-[clamp(5.4rem,10.2vh,6.9rem)]"
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
        avatarUrl={playerAvatarUrl}
        dialogueMessage={screen.narration.hudDialogueByPlayerId[player.id] ?? null}
        phase={board.gameState.phase}
        onAdvancePhase={board.advancePhase}
        containerClassName="!bottom-0 !left-0 !right-auto !z-[280] !justify-end !w-[clamp(11.8rem,36vw,16.8rem)] !h-[clamp(5.6rem,10.5vh,7.1rem)]"
        showPhaseControls={false}
      />
      <BoardMobilePhaseControls
        phase={board.gameState.phase}
        isPlayerTurn={board.isPlayerTurn}
        hasWinner={Boolean(board.winnerPlayerId)}
        onAdvancePhase={board.advancePhase}
      />
    </>
  );
}
