// src/components/game/board/ui/overlays/BoardMobilePanelsDialog.tsx - Dialogs móviles para detalle de carta e historial con entradas laterales.
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { Card } from "@/components/game/card/Card";
import { CombatLogEventRow } from "../CombatLogEventRow";

interface BoardMobilePanelsDialogProps {
  selectedCard: ICard | null;
  gameState: GameState;
  isHistoryOpen: boolean;
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
}

export function BoardMobilePanelsDialog({ selectedCard, gameState, isHistoryOpen, onSelectCard, onCloseCard, onCloseHistory }: BoardMobilePanelsDialogProps) {
  const [turnFilter, setTurnFilter] = useState<number | "ALL">("ALL");
  const [actorFilter, setActorFilter] = useState<"ALL" | "PLAYER" | "OPPONENT">("ALL");

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

  return (
    <AnimatePresence>
      {selectedCard && (
        <motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute left-0 right-14 top-[5.2rem] bottom-[8.2rem] z-[270] rounded-r-3xl border-r-2 border-cyan-500/60 bg-zinc-950/92 p-3 backdrop-blur-xl shadow-[14px_0_34px_rgba(0,0,0,0.72)] min-h-0 flex flex-col">
          <button aria-label="Cerrar detalle" onClick={onCloseCard} className="absolute right-3 top-3 text-cyan-300"><X size={22} /></button>
          <div className="shrink-0 h-[11rem] overflow-hidden flex items-center justify-center">
            <div className="origin-top scale-[0.46]"><Card card={selectedCard} /></div>
          </div>
          <div className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            <h3 className="text-lg font-black uppercase text-cyan-300">{selectedCard.name}</h3>
            <p className="mb-2 border-b border-zinc-800 pb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{selectedCard.faction} {selectedCard.type}</p>
            <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-line">{selectedCard.description}</p>
          </div>
        </motion.div>
      )}

      {isHistoryOpen && (
        <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute right-0 left-14 top-[5.2rem] bottom-[8.2rem] z-[270] rounded-l-3xl border-l-2 border-rose-500/60 bg-zinc-950/94 p-3 backdrop-blur-xl shadow-[-14px_0_34px_rgba(0,0,0,0.72)] min-h-0 flex flex-col">
          <div className="mb-2 flex items-center justify-between border-b border-zinc-700/80 pb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Combat Log</h3>
            <button aria-label="Cerrar historial" onClick={onCloseHistory} className="text-rose-300"><X size={22} /></button>
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <select aria-label="Filtro de turno" value={turnFilter} onChange={(event) => setTurnFilter(event.target.value === "ALL" ? "ALL" : Number(event.target.value))} className="rounded border border-cyan-500/40 bg-black/60 px-2 py-1 text-xs text-zinc-100">
              <option value="ALL">Turnos</option>
              {Array.from(new Set(gameState.combatLog.map((event) => event.turn))).sort((a, b) => b - a).map((turn) => <option key={turn} value={turn}>T{turn}</option>)}
            </select>
            <select aria-label="Filtro de actor" value={actorFilter} onChange={(event) => setActorFilter(event.target.value as "ALL" | "PLAYER" | "OPPONENT")} className="rounded border border-rose-500/40 bg-black/60 px-2 py-1 text-xs text-zinc-100">
              <option value="ALL">Actor</option>
              <option value="PLAYER">{gameState.playerA.name}</option>
              <option value="OPPONENT">{gameState.playerB.name}</option>
            </select>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            {visibleEvents.length === 0 && <p className="text-xs text-zinc-500">No hay eventos para estos filtros.</p>}
            {visibleEvents.slice().reverse().map((event) => (
              <CombatLogEventRow key={event.id} event={event} playerAId={gameState.playerA.id} playerAName={gameState.playerA.name} playerBId={gameState.playerB.id} playerBName={gameState.playerB.name} cardLookup={cardLookup} onCardClick={onSelectCard} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
