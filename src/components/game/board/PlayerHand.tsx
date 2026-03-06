// src/components/game/board/PlayerHand.tsx - Renderiza la mano del jugador con selección, acciones y estados obligatorios.
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { Card } from "@/components/game/card/Card";
import { Shield, Sword, Zap, Box } from "lucide-react"; // Importamos iconos de lucide

interface PlayerHandProps {
  hand: ICard[]; 
  playingCard: ICard | null; 
  hasSummoned: boolean;
  isPlayerTurn: boolean;
  highlightedCardIds?: string[];
  onMandatoryCardSelect?: (cardId: string) => void;
  onCardClick: (card: ICard, e: React.MouseEvent) => void;
  onPlayAction: (mode: BattleMode, e: React.MouseEvent) => void;
}

export function PlayerHand({
  hand,
  playingCard,
  hasSummoned,
  isPlayerTurn,
  highlightedCardIds = [],
  onMandatoryCardSelect,
  onCardClick,
  onPlayAction,
}: PlayerHandProps) {
  return (
    <div className="absolute bottom-0 left-0 w-full h-[500px] flex justify-center items-end z-40 pointer-events-none perspective-[1200px] pb-4">
      <div className="flex justify-center -space-x-8 pointer-events-none relative">
        {hand.map((card, i) => {
          const isSelected = card.runtimeId && playingCard?.runtimeId ? playingCard.runtimeId === card.runtimeId : playingCard === card;
          const isEntity = card.type === 'ENTITY';
          const isFusion = card.type === 'FUSION';
          const isTrap = card.type === 'TRAP';
          const isMandatorySelectable = highlightedCardIds.includes(card.runtimeId ?? card.id);
          
          // Bloqueamos la UI si es entidad y ya invocó
          const isBlocked = (isEntity || isFusion) && hasSummoned;

          return (
            <div key={`${card.id}-${i}`} className="relative">
              <AnimatePresence>
                {isSelected && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.8 }} 
                    animate={{ opacity: 1, y: -20, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 z-[100] flex gap-2 bg-zinc-950/90 p-2 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,1)] backdrop-blur-md whitespace-nowrap pointer-events-auto"
                  >
                    {isBlocked ? (
                      <span className="text-red-400 font-mono text-xs px-4 py-2 uppercase tracking-widest font-bold bg-red-950/40 rounded border border-red-500/20">Límite Alcanzado</span>
                    ) : (
                      <>
                        {/* BOTONES INTELIGENTES SEGÚN EL TIPO DE CARTA */}
                        {isEntity || isFusion ? (
                          <>
                            <button onClick={(e) => onPlayAction('ATTACK', e)} className="flex items-center gap-1.5 px-4 py-2 bg-red-950/40 hover:bg-red-900 border border-red-500/50 text-red-400 text-xs font-black rounded-lg transition-all"><Sword size={16} /> {isFusion ? "FUSIÓN ATQ" : "ATAQUE"}</button>
                            <button onClick={(e) => onPlayAction('DEFENSE', e)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-950/40 hover:bg-blue-900 border border-blue-500/50 text-blue-400 text-xs font-black rounded-lg transition-all"><Shield size={16} /> {isFusion ? "FUSIÓN DEF" : "DEFENSA"}</button>
                          </>
                        ) : isTrap ? (
                          <button onClick={(e) => onPlayAction('SET', e)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs font-black rounded-lg transition-all"><Box size={16} /> ARMAR TRAMPA</button>
                        ) : (
                          <>
                            <button onClick={(e) => onPlayAction('ACTIVATE', e)} className="flex items-center gap-1.5 px-4 py-2 bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-400 text-xs font-black rounded-lg transition-all"><Zap size={16} /> ACTIVAR</button>
                            <button onClick={(e) => onPlayAction('SET', e)} className="flex items-center gap-1.5 px-4 py-2 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/50 text-purple-400 text-xs font-black rounded-lg transition-all"><Box size={16} /> SET (OCULTAR)</button>
                          </>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                layoutId={`card-hand-${card.id}-${i}`} // Separamos el layoutId de la mano y evitamos colisiones con duplicadas
                initial={{ y: 200, scale: 0.86 }} 
                animate={{ 
                  y: isSelected ? -40 : 120, 
                  rotate: isSelected ? 0 : (i - hand.length / 2) * 2, 
                  scale: isSelected ? 1 : 0.86 
                }}
                whileHover={{ 
                  y: isSelected ? -40 : -20, 
                  scale: isSelected ? 1 : 0.96, 
                  zIndex: 100 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => {
                  if (!isPlayerTurn) {
                    return;
                  }
                  if (isMandatorySelectable && onMandatoryCardSelect) {
                    onMandatoryCardSelect(card.runtimeId ?? card.id);
                    return;
                  }
                  onCardClick(card, e);
                }}
                className={isPlayerTurn ? "cursor-pointer origin-bottom pointer-events-auto" : "origin-bottom pointer-events-auto"}
                style={{ zIndex: isSelected ? 100 : i }}
              >
                <div className={isMandatorySelectable ? "rounded-xl ring-4 ring-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.65)] animate-pulse" : ""}>
                  <Card card={card} isSelected={isSelected} />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
