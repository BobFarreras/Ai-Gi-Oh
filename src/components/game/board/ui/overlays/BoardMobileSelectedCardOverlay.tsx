// src/components/game/board/ui/overlays/BoardMobileSelectedCardOverlay.tsx - Overlay móvil centrado para carta seleccionada de mano con acciones y cierre rápido.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Box, Shield, Sword, X, Zap } from "lucide-react";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";

interface BoardMobileSelectedCardOverlayProps {
  card: ICard | null;
  hasSummoned: boolean;
  isPlayerTurn: boolean;
  source: "HAND" | "BOARD";
  isOpponentCard?: boolean;
  canActivateExecutionFromBoard?: boolean;
  canSetEntityToAttackFromBoard?: boolean;
  onClose: () => void;
  onPlayAction: (mode: BattleMode, event: React.MouseEvent) => void;
  onActivateExecutionFromBoard?: () => void;
  onSetEntityToAttackFromBoard?: () => void;
}

export function BoardMobileSelectedCardOverlay({
  card,
  hasSummoned,
  isPlayerTurn,
  source,
  isOpponentCard = false,
  canActivateExecutionFromBoard = false,
  canSetEntityToAttackFromBoard = false,
  onClose,
  onPlayAction,
  onActivateExecutionFromBoard,
  onSetEntityToAttackFromBoard,
}: BoardMobileSelectedCardOverlayProps) {
  if (!isPlayerTurn && source === "HAND") return null;
  const isEntity = card?.type === "ENTITY";
  const isFusion = card?.type === "FUSION";
  const isTrap = card?.type === "TRAP";
  const isExecution = card?.type === "EXECUTION";
  const isBlocked = Boolean(card && (isEntity || isFusion) && hasSummoned);
  const isBoardSelection = source === "BOARD";

  const handActionButtons = isBlocked ? (
    <span className="rounded border border-red-400/70 bg-red-700/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-[0_0_12px_rgba(248,113,113,0.6)]">Límite</span>
  ) : isEntity || isFusion ? (
    <>
      <button onClick={(event) => onPlayAction("ATTACK", event)} className="flex items-center gap-1 rounded border border-red-300/80 bg-red-600/80 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(239,68,68,0.7)]">
        <Sword size={12} /> Atq
      </button>
      <button onClick={(event) => onPlayAction("DEFENSE", event)} className="flex items-center gap-1 rounded border border-sky-300/80 bg-sky-600/80 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(56,189,248,0.7)]">
        <Shield size={12} /> Def
      </button>
    </>
  ) : isTrap ? (
    <button onClick={(event) => onPlayAction("SET", event)} className="flex items-center gap-1 rounded border border-fuchsia-300/80 bg-fuchsia-600/80 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(217,70,239,0.7)]">
      <Box size={12} /> Armar
    </button>
  ) : (
    <>
      <button onClick={(event) => onPlayAction("ACTIVATE", event)} className="flex items-center gap-1 rounded border border-cyan-300/80 bg-cyan-600/80 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(34,211,238,0.7)]">
        <Zap size={12} /> Activar
      </button>
      <button onClick={(event) => onPlayAction("SET", event)} className="flex items-center gap-1 rounded border border-violet-300/80 bg-violet-600/80 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-[0_0_14px_rgba(139,92,246,0.7)]">
        <Box size={12} /> Set
      </button>
    </>
  );
  const boardActionButton = isOpponentCard ? null : (
    <>
      {isExecution && canActivateExecutionFromBoard ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onActivateExecutionFromBoard?.();
          }}
          className="flex items-center gap-1 rounded border border-cyan-300/90 bg-cyan-500/85 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-950 shadow-[0_0_16px_rgba(34,211,238,0.85)]"
        >
          <Zap size={12} /> Activar
        </button>
      ) : null}
      {canSetEntityToAttackFromBoard ? (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onSetEntityToAttackFromBoard?.();
          }}
          className="flex items-center gap-1 rounded border border-amber-300/90 bg-amber-500/85 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-950 shadow-[0_0_16px_rgba(251,191,36,0.85)]"
        >
          <Sword size={12} /> Ataque
        </button>
      ) : null}
    </>
  );

  return (
    <AnimatePresence>
      {card ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 18 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="pointer-events-none absolute inset-0 z-[320] flex items-center justify-center"
        >
          <div className="pointer-events-auto relative px-1 pb-2 pt-6">
            <div className="absolute left-0 top-0 flex items-center gap-1">
              {isBoardSelection ? boardActionButton : handActionButtons}
            </div>
            <button aria-label="Cerrar selección" onClick={onClose} className="absolute right-0 top-0 p-1 text-cyan-300">
              <X size={16} />
            </button>
            <button aria-label={`Deseleccionar ${card.name}`} onClick={onClose} className="drop-shadow-[0_0_22px_rgba(34,211,238,0.55)]">
              <div className="relative h-[266px] w-[182px] overflow-visible">
                <div style={{ width: "260px", height: "380px", transform: "scale(0.7)", transformOrigin: "top left" }}>
                  <Card card={card} isSelected disableHoverEffects disableDefaultShadow isPerformanceMode />
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
