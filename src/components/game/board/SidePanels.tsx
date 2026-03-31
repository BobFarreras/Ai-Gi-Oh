// src/components/game/board/SidePanels.tsx - Renderiza panel de detalle y combat log con scroll robusto en viewport reducido.
"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { Card } from "../card/Card";
import { CombatLogEventRow } from "./ui/CombatLogEventRow";
import { resolveLiveSelectedCard } from "@/components/game/board/internal/resolve-live-selected-card";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";

interface SidePanelsProps {
  selectedCard: ICard | null;
  gameState: GameState;
  isHistoryOpen: boolean;
  canActivateSelectedExecution?: boolean;
  pendingTrapActivationPrompt?: ITrapActivationPrompt | null;
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
  onActivateSelectedExecution?: () => void;
  onActivatePendingTrap?: () => void;
  onSkipPendingTrap?: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const detailPanelClass =
  "absolute left-0 top-[clamp(6.25rem,12vh,9.25rem)] bottom-[clamp(8.25rem,22vh,14.25rem)] w-[clamp(17rem,32vw,23rem)] bg-zinc-950/84 border-r-2 border-cyan-500/50 z-[90] p-4 md:p-5 backdrop-blur-2xl shadow-[20px_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-r-3xl min-h-0";
const historyPanelClass =
  "absolute right-3 md:right-5 top-[clamp(5.75rem,11vh,8.5rem)] bottom-[clamp(6.75rem,18vh,11.75rem)] w-[clamp(17rem,34vw,24rem)] bg-zinc-950/88 border-l-2 border-red-500/50 z-[90] p-4 md:p-5 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-l-3xl min-h-0";

export function SidePanels({
  selectedCard,
  gameState,
  isHistoryOpen,
  canActivateSelectedExecution = false,
  pendingTrapActivationPrompt = null,
  onSelectCard,
  onCloseCard,
  onCloseHistory,
  onActivateSelectedExecution = () => undefined,
  onActivatePendingTrap = () => undefined,
  onSkipPendingTrap = () => undefined,
}: SidePanelsProps) {
  const [turnFilter, setTurnFilter] = useState<number | "ALL">("ALL");
  const [actorFilter, setActorFilter] = useState<"ALL" | "PLAYER" | "OPPONENT">("ALL");
  const [detailCardScale, setDetailCardScale] = useState(0.6);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateScale = () => {
      const panelWidth = clamp(window.innerWidth * 0.32, 272, 368);
      const panelHeight = clamp(window.innerHeight * 0.28, 192, 240);
      const widthRatio = (panelWidth - 24) / 260;
      const heightRatio = (panelHeight - 12) / 380;
      setDetailCardScale(clamp(Math.min(widthRatio, heightRatio), 0.38, 0.66));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const cardLookup = useMemo(() => {
    const cards = [
      ...gameState.playerA.deck, ...gameState.playerB.deck, ...gameState.playerA.hand, ...gameState.playerB.hand,
      ...gameState.playerA.graveyard, ...gameState.playerB.graveyard,
      ...gameState.playerA.activeEntities.map((entity) => entity.card), ...gameState.playerB.activeEntities.map((entity) => entity.card),
      ...gameState.playerA.activeExecutions.map((entity) => entity.card), ...gameState.playerB.activeExecutions.map((entity) => entity.card),
    ];
    return cards.reduce<Record<string, ICard>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [gameState]);

  const visibleEvents = useMemo(() => {
    const actorToId = { PLAYER: gameState.playerA.id, OPPONENT: gameState.playerB.id } as const;
    return gameState.combatLog.filter((event) => {
      if (event.eventType === "ATTACK_DECLARED") return false;
      const turnMatches = turnFilter === "ALL" || event.turn === turnFilter;
      const actorMatches = actorFilter === "ALL" || event.actorPlayerId === actorToId[actorFilter];
      return turnMatches && actorMatches;
    });
  }, [actorFilter, gameState.combatLog, gameState.playerA.id, gameState.playerB.id, turnFilter]);
  const liveSelectedCard = useMemo(
    () => resolveLiveSelectedCard(selectedCard, gameState),
    [gameState, selectedCard],
  );
  const isTrapPromptForSelectedCard = Boolean(
    liveSelectedCard && pendingTrapActivationPrompt && pendingTrapActivationPrompt.trapCard.id === liveSelectedCard.id,
  );

  return (
    <AnimatePresence>
      {liveSelectedCard && (
        <motion.div
          key={`left-panel-${liveSelectedCard.runtimeId ?? liveSelectedCard.id}`}
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`${detailPanelClass} ${isTrapPromptForSelectedCard ? "ring-2 ring-fuchsia-300/75 shadow-[0_0_34px_rgba(217,70,239,0.45)] animate-pulse" : ""}`}
        >
          <button
            aria-label="Cerrar detalle"
            onClick={isTrapPromptForSelectedCard ? onSkipPendingTrap : onCloseCard}
            className="absolute top-4 right-4 text-cyan-500 hover:text-white z-20"
          >
            <X size={24} />
          </button>
          <div className="relative mt-1 mb-2 flex justify-center z-10 shrink-0 h-[clamp(12rem,28vh,15rem)] overflow-hidden">
            <div key={liveSelectedCard.runtimeId ?? liveSelectedCard.id} className="origin-top" style={{ transform: `scale(${detailCardScale})` }}>
              <Card card={liveSelectedCard} />
            </div>
          </div>
          <div className="text-white pr-2 mt-1 md:mt-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <h2 className="text-xl md:text-2xl font-black text-cyan-300 uppercase tracking-tight">{liveSelectedCard.name}</h2>
            <span className="text-zinc-500 text-[11px] md:text-xs tracking-widest uppercase font-bold mb-3 block border-b border-zinc-800 pb-2">{liveSelectedCard.faction} {liveSelectedCard.type}</span>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{liveSelectedCard.description}</p>
            {(canActivateSelectedExecution || isTrapPromptForSelectedCard) ? (
              <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  aria-label="Confirmar activación de carta seleccionada"
                  onClick={isTrapPromptForSelectedCard ? onActivatePendingTrap : onActivateSelectedExecution}
                  className="rounded-lg border border-emerald-300/70 bg-emerald-700/35 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-700/50"
                >
                  Activar
                </button>
                <button
                  type="button"
                  aria-label="Cancelar activación de carta seleccionada"
                  onClick={isTrapPromptForSelectedCard ? onSkipPendingTrap : onCloseCard}
                  className="rounded-lg border border-zinc-500/60 bg-zinc-900/75 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-100 hover:border-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}

      {isHistoryOpen && (
        <motion.div key="right-panel" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className={historyPanelClass}>
          <div className="flex justify-between items-center mb-4 border-b border-zinc-700/80 pb-4">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Combat Log</h2>
            <button aria-label="Cerrar combat log" onClick={onCloseHistory} className="text-red-500 hover:text-white"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select aria-label="Filtro de turno" value={turnFilter} onChange={(event) => setTurnFilter(event.target.value === "ALL" ? "ALL" : Number(event.target.value))} className="bg-black/60 border border-cyan-500/40 px-2 py-1 text-xs text-zinc-200 rounded">
              <option value="ALL">Todos los turnos</option>
              {Array.from(new Set(gameState.combatLog.map((event) => event.turn))).sort((a, b) => b - a).map((turn) => <option key={turn} value={turn}>Turno {turn}</option>)}
            </select>
            <select aria-label="Filtro de actor" value={actorFilter} onChange={(event) => setActorFilter(event.target.value as "ALL" | "PLAYER" | "OPPONENT")} className="bg-black/60 border border-red-500/40 px-2 py-1 text-xs text-zinc-200 rounded">
              <option value="ALL">Todos</option><option value="PLAYER">{gameState.playerA.name}</option><option value="OPPONENT">{gameState.playerB.name}</option>
            </select>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            {visibleEvents.length === 0 && <p className="text-zinc-500">No hay eventos para estos filtros.</p>}
            {visibleEvents.slice().reverse().map((event) => (
              <CombatLogEventRow key={event.id} event={event} playerAId={gameState.playerA.id} playerAName={gameState.playerA.name} playerBId={gameState.playerB.id} playerBName={gameState.playerB.name} cardLookup={cardLookup} onCardClick={onSelectCard} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
