// src/components/game/board/ui/overlays/BoardMobilePanelsDialog.tsx - Dialogs móviles para detalle de carta e historial con entradas laterales.
"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { Card } from "@/components/game/card/Card";
import { CombatLogEventRow } from "../CombatLogEventRow";
import { resolveLiveSelectedCard } from "@/components/game/board/internal/resolve-live-selected-card";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";

interface BoardMobilePanelsDialogProps {
  selectedCard: ICard | null;
  gameState: GameState;
  isHistoryOpen: boolean;
  pendingTrapActivationPrompt?: ITrapActivationPrompt | null;
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
  onActivatePendingTrap?: () => void;
  onSkipPendingTrap?: () => void;
}

export function BoardMobilePanelsDialog({
  selectedCard,
  gameState,
  isHistoryOpen,
  pendingTrapActivationPrompt = null,
  onSelectCard,
  onCloseCard,
  onCloseHistory,
  onActivatePendingTrap = () => undefined,
  onSkipPendingTrap = () => undefined,
}: BoardMobilePanelsDialogProps) {
  const [turnFilter, setTurnFilter] = useState<number | "ALL">("ALL");
  const [actorFilter, setActorFilter] = useState<"ALL" | "PLAYER" | "OPPONENT">("ALL");
  const pathname = usePathname();

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
  const selectedCardOrTrapPromptCard = pendingTrapActivationPrompt?.trapCard ?? selectedCard;
  const liveSelectedCard = useMemo(() => resolveLiveSelectedCard(selectedCardOrTrapPromptCard, gameState), [gameState, selectedCardOrTrapPromptCard]);
  const isTrapPromptForSelectedCard = Boolean(liveSelectedCard && pendingTrapActivationPrompt && pendingTrapActivationPrompt.trapCard.id === liveSelectedCard.id);
  const isTutorialTrapPromptLocked = isTrapPromptForSelectedCard && pathname?.includes("/hub/academy/training/tutorial");
  const detailPanelTopClassName = isTrapPromptForSelectedCard ? "top-[7.4rem]" : "top-[5.2rem]";

  return (
    <AnimatePresence>
      {liveSelectedCard && (
        <motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34 }} className={`absolute left-0 right-14 ${detailPanelTopClassName} bottom-[8.2rem] z-[270] rounded-r-3xl border-r-2 border-cyan-500/60 bg-zinc-950/92 p-3 backdrop-blur-xl shadow-[14px_0_34px_rgba(0,0,0,0.72)] min-h-0 flex flex-col`}>
          <button
            aria-label="Cerrar detalle"
            onClick={isTutorialTrapPromptLocked ? () => undefined : isTrapPromptForSelectedCard ? onSkipPendingTrap : onCloseCard}
            disabled={isTutorialTrapPromptLocked}
            className="absolute right-3 top-3 text-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X size={22} />
          </button>
          <div className="mt-1 min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            {isTrapPromptForSelectedCard ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-fuchsia-400/45 bg-fuchsia-950/40 p-2">
                <div className="h-[clamp(4.9rem,17vw,5.7rem)] w-[clamp(3.35rem,12vw,3.9rem)] shrink-0 overflow-hidden rounded border border-fuchsia-300/50 bg-black/60">
                  <div style={{ width: "260px", height: "380px", transform: "scale(0.21)", transformOrigin: "top left" }}>
                    <Card card={liveSelectedCard} disableHoverEffects disableDefaultShadow isPerformanceMode />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-200">Decisión de trampa</p>
                  <p className="mt-1 text-xs font-bold text-fuchsia-100">¿Quieres activar esta carta trampa?</p>
                </div>
              </div>
            ) : null}
            <h3 className="text-lg font-black uppercase text-cyan-300">{liveSelectedCard.name}</h3>
            <p className="mb-2 border-b border-zinc-800 pb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{liveSelectedCard.faction} {liveSelectedCard.type}</p>
            <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-line">{liveSelectedCard.description}</p>
            {isTrapPromptForSelectedCard ? (
              <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  aria-label="Activar trampa pendiente"
                  onClick={onActivatePendingTrap}
                  className="rounded-lg border border-emerald-300/70 bg-emerald-700/35 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100 hover:bg-emerald-700/50"
                >
                  Activar
                </button>
                <button
                  type="button"
                  aria-label="Cancelar trampa pendiente"
                  onClick={isTutorialTrapPromptLocked ? () => undefined : onSkipPendingTrap}
                  disabled={isTutorialTrapPromptLocked}
                  className="rounded-lg border border-zinc-500/60 bg-zinc-900/75 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-100 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Cancelar
                </button>
              </div>
            ) : null}
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
