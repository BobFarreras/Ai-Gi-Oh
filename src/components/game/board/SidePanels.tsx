// src/components/game/board/SidePanels.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { Card } from "../card/Card";
import { CombatLogEventRow } from "./ui/CombatLogEventRow";

interface SidePanelsProps {
  selectedCard: ICard | null;
  gameState: GameState;
  isHistoryOpen: boolean;
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
}

export function SidePanels({ selectedCard, gameState, isHistoryOpen, onSelectCard, onCloseCard, onCloseHistory }: SidePanelsProps) {
  const [turnFilter, setTurnFilter] = useState<number | "ALL">("ALL");
  const [actorFilter, setActorFilter] = useState<"ALL" | "PLAYER" | "OPPONENT">("ALL");
  const cardLookup = useMemo(() => {
    const cards: ICard[] = [
      ...gameState.playerA.deck,
      ...gameState.playerB.deck,
      ...gameState.playerA.hand,
      ...gameState.playerB.hand,
      ...gameState.playerA.graveyard,
      ...gameState.playerB.graveyard,
      ...gameState.playerA.activeEntities.map((entity) => entity.card),
      ...gameState.playerB.activeEntities.map((entity) => entity.card),
      ...gameState.playerA.activeExecutions.map((entity) => entity.card),
      ...gameState.playerB.activeExecutions.map((entity) => entity.card),
    ];
    return cards.reduce<Record<string, ICard>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [gameState]);

  const visibleEvents = useMemo(
    () =>
      gameState.combatLog.filter((event) => {
        if (event.eventType === "ATTACK_DECLARED") {
          return false;
        }
        const actorToId = {
          PLAYER: gameState.playerA.id,
          OPPONENT: gameState.playerB.id,
        } as const;
        const turnMatches = turnFilter === "ALL" || event.turn === turnFilter;
        const actorMatches = actorFilter === "ALL" || event.actorPlayerId === actorToId[actorFilter];
        return turnMatches && actorMatches;
      }),
    [actorFilter, gameState.combatLog, gameState.playerA.id, gameState.playerB.id, turnFilter],
  );

  return (
    <AnimatePresence>
      {selectedCard && (
        <motion.div
          key="left-panel"
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-[148px] left-4 md:left-6 w-[min(22rem,34vw)] bottom-[228px] bg-zinc-950/80 border-r-2 border-cyan-500/50 z-[230] p-5 backdrop-blur-2xl shadow-[20px_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-r-3xl"
        >
          <button onClick={onCloseCard} className="absolute top-4 right-4 text-cyan-500 hover:text-white z-20">
            <X size={24} />
          </button>
          <div className="relative mt-2 flex justify-center z-10 scale-90 origin-top">
            <Card card={selectedCard} />
          </div>
          <div className="text-white overflow-y-auto pr-2 z-10 mt-2 custom-scrollbar flex-1">
            <h2 className="text-2xl font-black text-cyan-300 uppercase tracking-tight">{selectedCard.name}</h2>
            <span className="text-zinc-500 text-xs tracking-widest uppercase font-bold mb-4 block border-b border-zinc-800 pb-2">
              {selectedCard.faction} {selectedCard.type}
            </span>
            <p className="text-zinc-300 text-sm leading-relaxed">{selectedCard.description}</p>
          </div>
        </motion.div>
      )}

      {isHistoryOpen && (
        <motion.div
          key="right-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-[136px] right-4 md:right-6 w-[min(24rem,36vw)] bottom-[190px] bg-zinc-950/85 border-l-2 border-red-500/50 z-[230] p-5 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-l-3xl"
        >
          <div className="flex justify-between items-center mb-4 border-b border-zinc-700/80 pb-4">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Combat Log</h2>
            <button onClick={onCloseHistory} className="text-red-500 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select
              aria-label="Filtro de turno"
              value={turnFilter}
              onChange={(event) => setTurnFilter(event.target.value === "ALL" ? "ALL" : Number(event.target.value))}
              className="bg-black/60 border border-cyan-500/40 px-2 py-1 text-xs text-zinc-200 rounded"
            >
              <option value="ALL">Todos los turnos</option>
              {Array.from(new Set(gameState.combatLog.map((event) => event.turn)))
                .sort((a, b) => b - a)
                .map((turn) => (
                  <option key={turn} value={turn}>
                    Turno {turn}
                  </option>
                ))}
            </select>
            <select
              aria-label="Filtro de actor"
              value={actorFilter}
              onChange={(event) => setActorFilter(event.target.value as "ALL" | "PLAYER" | "OPPONENT")}
              className="bg-black/60 border border-red-500/40 px-2 py-1 text-xs text-zinc-200 rounded"
            >
              <option value="ALL">Todos</option>
              <option value="PLAYER">{gameState.playerA.name}</option>
              <option value="OPPONENT">{gameState.playerB.name}</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            {visibleEvents.length === 0 && <p className="text-zinc-500">No hay eventos para estos filtros.</p>}
            {visibleEvents
              .slice()
              .reverse()
              .map((event) => (
                <CombatLogEventRow
                  key={event.id}
                  event={event}
                  playerAId={gameState.playerA.id}
                  playerAName={gameState.playerA.name}
                  playerBId={gameState.playerB.id}
                  playerBName={gameState.playerB.name}
                  cardLookup={cardLookup}
                  onCardClick={onSelectCard}
                />
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
