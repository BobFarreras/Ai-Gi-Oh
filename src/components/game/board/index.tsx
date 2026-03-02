"use client";

import { Clock, History } from "lucide-react";
import { Battlefield } from "./Battlefield";
import { PlayerHUD } from "./PlayerHUD";
import { PlayerHand } from "./PlayerHand";
import { SidePanels } from "./SidePanels";
import { useBoard } from "./hooks/useBoard";
import { OpponentHandFan } from "./ui/OpponentHandFan";
import { PhasePanel } from "./ui/PhasePanel";
import { TurnTimer } from "./ui/TurnTimer";

export function Board() {
  const {
    gameState,
    selectedCard,
    playingCard,
    isHistoryOpen,
    activeAttackerId,
    revealedEntities,
    lastError,
    pendingActionHint,
    pendingDiscardCardIds,
    pendingEntitySelectionIds,
    opponentDifficulty,
    setIsHistoryOpen,
    toggleCardSelection,
    clearSelection,
    clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase,
    resolvePendingHandDiscard,
    isPlayerTurn,
  } = useBoard();

  const player = gameState.playerA;
  const opponent = gameState.playerB;

  return (
    <div className="relative w-full h-screen bg-[#020305] overflow-hidden font-sans cursor-crosshair" onClick={clearSelection}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />
      <div className="absolute inset-0 shadow-[inset_0_0_300px_rgba(0,0,0,1)] pointer-events-none" />

      {lastError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[140] w-[92%] max-w-xl bg-red-950/90 border border-red-500/60 text-red-100 px-5 py-4 rounded-xl shadow-[0_0_35px_rgba(239,68,68,0.4)]">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-xs font-black tracking-wider uppercase text-red-300">{lastError.code}</p>
              <p className="text-sm font-semibold">{lastError.message}</p>
            </div>
            <button
              aria-label="Cerrar mensaje de error"
              onClick={(event) => {
                event.stopPropagation();
                clearError();
              }}
              className="text-red-200 hover:text-white font-black"
            >
              X
            </button>
          </div>
        </div>
      )}

      {pendingActionHint && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[130] w-[92%] max-w-3xl bg-amber-950/85 border border-amber-400/50 text-amber-100 px-5 py-3 rounded-xl shadow-[0_0_35px_rgba(251,191,36,0.25)]">
          <p className="text-xs font-black tracking-wider uppercase text-amber-300">Acción obligatoria</p>
          <p className="text-sm font-semibold">{pendingActionHint}</p>
        </div>
      )}

      <div className="absolute top-6 left-6 z-50 flex flex-col items-start pointer-events-auto w-80">
        <div className="w-full bg-zinc-950/90 border-2 border-cyan-500/50 backdrop-blur-xl px-6 py-3 rounded-t-2xl flex items-center justify-between shadow-[0_10px_40px_rgba(6,182,212,0.5)]">
          <div className="flex items-center gap-3">
            <Clock className="text-cyan-400 w-6 h-6 animate-pulse" />
            <span className="font-black text-white tracking-widest text-xl uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              Turno {gameState.turn}
            </span>
          </div>
          <TurnTimer key={`${gameState.turn}-${gameState.phase}`} onTimeUp={advancePhase} />
        </div>
        <PhasePanel
          phase={gameState.phase}
          hasNormalSummonedThisTurn={gameState.hasNormalSummonedThisTurn}
          isPlayerTurn={isPlayerTurn}
          onAdvancePhase={advancePhase}
        />
      </div>

      <OpponentHandFan hand={opponent.hand} />

      <PlayerHUD
        isOpponent={true}
        player={opponent}
        isActiveTurn={gameState.activePlayerId === opponent.id}
        badgeText={`Dificultad ${opponentDifficulty}`}
      />
      <PlayerHUD isOpponent={false} player={player} isActiveTurn={isPlayerTurn} />

      <div onClick={(event) => event.stopPropagation()}>
        <Battlefield
          playerActiveEntities={player.activeEntities}
          playerActiveExecutions={player.activeExecutions}
          opponentActiveEntities={opponent.activeEntities}
          opponentActiveExecutions={opponent.activeExecutions}
          playerDeckCount={player.deck.length}
          opponentDeckCount={opponent.deck.length}
          playerTopGraveCard={player.graveyard[player.graveyard.length - 1] || null}
          opponentTopGraveCard={opponent.graveyard[opponent.graveyard.length - 1] || null}
          playerGraveyardCount={player.graveyard.length}
          opponentGraveyardCount={opponent.graveyard.length}
          activeAttackerId={activeAttackerId}
          selectedCard={selectedCard}
          revealedEntities={revealedEntities}
          highlightedPlayerEntityIds={pendingEntitySelectionIds}
          onEntityClick={handleEntityClick}
        />
      </div>

      <PlayerHand
        hand={player.hand}
        playingCard={playingCard}
        hasSummoned={gameState.hasNormalSummonedThisTurn}
        isPlayerTurn={isPlayerTurn}
        highlightedCardIds={pendingDiscardCardIds}
        onMandatoryCardSelect={resolvePendingHandDiscard}
        onCardClick={toggleCardSelection}
        onPlayAction={executePlayAction}
      />

      <div onClick={(event) => event.stopPropagation()}>
        <SidePanels
          selectedCard={selectedCard}
          isHistoryOpen={isHistoryOpen}
          onCloseCard={clearSelection}
          onCloseHistory={() => setIsHistoryOpen(false)}
        />
      </div>

      {!isHistoryOpen && (
        <button
          aria-label="Abrir historial de batalla"
          onClick={(event) => {
            event.stopPropagation();
            setIsHistoryOpen(true);
          }}
          className="absolute bottom-6 right-6 z-50 bg-zinc-950/90 border-2 border-red-500/50 text-red-500 p-4 rounded-full hover:bg-red-950 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all"
        >
          <History size={24} />
        </button>
      )}
    </div>
  );
}
