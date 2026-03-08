// src/components/game/board/PlayerHand.tsx - Renderiza la mano del jugador con selección, acciones y estados obligatorios.
"use client";

import { useEffect, useState } from "react";
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
  cardScale?: number;
  overlapPx?: number;
  handYOffsetPx?: number;
  containerHeightPx?: number;
  hoverLiftPx?: number;
  centerOffsetPx?: number;
  dockRight?: boolean;
  bottomPx?: number;
  isMobileLayout?: boolean;
  showInlineActionPopover?: boolean;
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
  cardScale = 0.82,
  overlapPx = 22,
  handYOffsetPx = 118,
  containerHeightPx = 500,
  hoverLiftPx = 34,
  centerOffsetPx = 0,
  dockRight = false,
  bottomPx = 0,
  isMobileLayout = false,
  showInlineActionPopover = true,
  onMandatoryCardSelect,
  onCardClick,
  onPlayAction,
}: PlayerHandProps) {
  const [isLeftCardHovered, setIsLeftCardHovered] = useState(false);
  const [mobileViewportWidth, setMobileViewportWidth] = useState(390);
  useEffect(() => {
    if (!isMobileLayout) return;
    const sync = () => setMobileViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [isMobileLayout]);
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const effectiveCardScale = isMobileLayout ? clamp(cardScale, 0.3, 0.42) : cardScale;
  const mobileAvailableWidth = Math.max(130, mobileViewportWidth - 176);
  const estimatedCardWidth = 260 * effectiveCardScale;
  const mobileOverlapPx =
    hand.length <= 1
      ? 0
      : clamp(Math.round(((estimatedCardWidth * hand.length) - mobileAvailableWidth) / (hand.length - 1)), 30, Math.round(estimatedCardWidth - 18));
  const effectiveOverlapPx = isMobileLayout
    ? mobileOverlapPx
    : hand.length >= 5
      ? overlapPx + 24
      : hand.length === 4
        ? overlapPx + 10
        : overlapPx;
  const isSelectedCardVisible = Boolean(playingCard);
  const handLayerClass = isLeftCardHovered || isSelectedCardVisible ? "z-[180]" : "z-40";

  return (
    <div
      className={`absolute ${isMobileLayout ? "right-0" : "left-0 w-full"} flex items-end pointer-events-none perspective-[1200px] ${isMobileLayout ? "pb-0 pr-1" : "pb-4"} ${dockRight ? "justify-end" : "justify-center"} ${handLayerClass}`}
      style={{
        height: `${containerHeightPx}px`,
        transform: `translateX(${centerOffsetPx}px)`,
        bottom: `${bottomPx}px`,
        width: isMobileLayout ? `${mobileAvailableWidth}px` : undefined,
      }}
    >
      <div className="flex justify-center pointer-events-none relative">
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
                {showInlineActionPopover && isSelected && (
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
                  y: isSelected ? (isMobileLayout ? handYOffsetPx - 8 : -40) : handYOffsetPx, 
                  rotate: isSelected ? 0 : isMobileLayout ? (i - hand.length / 2) * 1.2 : (i - hand.length / 2) * 2, 
                  scale: isSelected ? Math.min(1, effectiveCardScale + 0.1) : effectiveCardScale 
                }}
                whileHover={
                  isMobileLayout
                    ? undefined
                    : {
                        y: isSelected ? -40 : -Math.min(hoverLiftPx, 12),
                        scale: isSelected ? Math.min(1, cardScale + 0.1) : Math.min(1, cardScale + 0.1),
                        zIndex: 9999,
                      }
                }
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onHoverStart={() => {
                  if (isMobileLayout) return;
                  if (i === 0) setIsLeftCardHovered(true);
                }}
                onHoverEnd={() => {
                  if (isMobileLayout) return;
                  if (i === 0) setIsLeftCardHovered(false);
                }}
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
                style={{ zIndex: isSelected ? 100 : i, marginLeft: i === 0 ? 0 : -effectiveOverlapPx }}
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
