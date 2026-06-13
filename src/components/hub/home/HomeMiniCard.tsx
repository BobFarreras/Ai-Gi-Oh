// src/components/hub/home/HomeMiniCard.tsx - Miniatura de carta reutilizable para deck/almacén basada en CardThumbnail estático.
"use client";

import { ICard } from "@/core/entities/ICard";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { DragEvent } from "react";

interface HomeMiniCardProps {
  card: ICard | null;
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  showSlotContainer?: boolean;
  versionTier?: number;
  level?: number;
  xp?: number;
  isDraggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
  dataTutorialId?: string;
  dataTutorialGroup?: string;
}

export function HomeMiniCard({
  card,
  label,
  isSelected = false,
  onClick,
  showSlotContainer = true,
  versionTier = 0,
  level = 0,
  xp = 0,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  dataTutorialId,
  dataTutorialGroup,
}: HomeMiniCardProps) {
  const filledContainerClass = showSlotContainer
    ? isSelected
      ? "relative w-full aspect-[13/19] rounded-md sm:rounded-lg border-2 border-amber-400 bg-[#0a1320] shadow-[0_0_15px_rgba(251,191,36,0.3)] overflow-visible transition-all"
      : "relative w-full aspect-[13/19] rounded-md sm:rounded-lg border border-cyan-900/55 bg-[#081220] overflow-visible hover:border-cyan-500/50 transition-all cursor-pointer"
    : isSelected
      ? "relative w-full aspect-[13/19] overflow-visible transition-all ring-2 ring-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.35)]"
      : "relative w-full aspect-[13/19] overflow-visible transition-all cursor-pointer";
  const emptyContainerClass = isSelected
    ? "relative w-full aspect-[13/19] rounded-md sm:rounded-lg border-2 border-amber-400 bg-[#0a1320] shadow-[0_0_15px_rgba(251,191,36,0.3)] overflow-visible transition-all"
    : "relative w-full aspect-[13/19] rounded-md sm:rounded-lg border border-cyan-900/55 bg-[#081220] overflow-visible hover:border-cyan-500/50 transition-all cursor-pointer";

  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { type: "button" as const, "aria-label": label, onClick, draggable: isDraggable, onDragStart, onDragOver, onDrop }
    : { "aria-label": label, draggable: isDraggable, onDragStart, onDragOver, onDrop };

  if (!card) {
    return (
        <Wrapper
        {...wrapperProps}
        data-tutorial-id={dataTutorialId}
        data-tutorial-group={dataTutorialGroup}
        className={`${emptyContainerClass} flex items-center justify-center text-center text-[8px] sm:text-[10px] font-semibold text-cyan-100/20 hover:text-cyan-100/50 hover:bg-cyan-950/30`}
      >
        <span className="opacity-50 font-mono tracking-widest">SLOT<br/>{label.split(' ')[1]}</span>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} data-tutorial-id={dataTutorialId} data-tutorial-group={dataTutorialGroup} className={filledContainerClass}>
      {/* La miniatura llena la celda; el wrapper ya impone la proporción de carta. */}
      <div className="pointer-events-none absolute inset-0">
        <CardThumbnail card={card} versionTier={versionTier} level={level} xp={xp} isSelected={isSelected} />
      </div>
    </Wrapper>
  );
}
