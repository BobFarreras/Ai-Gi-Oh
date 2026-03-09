// src/components/hub/home/HomeMiniCard.tsx - Miniatura de carta reutilizable para deck/almacén con progreso visual.
"use client";

import { ICard } from "@/core/entities/ICard";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";
import { Card } from "@/components/game/card/Card";
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
  masteryPassiveSkillId?: string | null;
  size?: "default" | "mobileLarge";
  isDraggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
  isPerformanceMode?: boolean;
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
  masteryPassiveSkillId = null,
  size = "default",
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  isPerformanceMode = false,
}: HomeMiniCardProps) {
  const filledContainerClass = showSlotContainer
    ? isSelected
      ? "relative w-full aspect-[3/4] rounded-md sm:rounded-lg border-2 border-amber-400 bg-[#0a1320] shadow-[0_0_15px_rgba(251,191,36,0.3)] overflow-hidden transition-all"
      : "relative w-full aspect-[3/4] rounded-md sm:rounded-lg border border-cyan-900/55 bg-[#081220] overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer"
    : isSelected
      ? "relative w-full aspect-[3/4] overflow-visible transition-all ring-2 ring-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.35)]"
      : "relative w-full aspect-[3/4] overflow-visible transition-all cursor-pointer";
  const emptyContainerClass = isSelected
    ? "relative w-full aspect-[3/4] rounded-md sm:rounded-lg border-2 border-amber-400 bg-[#0a1320] shadow-[0_0_15px_rgba(251,191,36,0.3)] overflow-hidden transition-all"
    : "relative w-full aspect-[3/4] rounded-md sm:rounded-lg border border-cyan-900/55 bg-[#081220] overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer";

  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { type: "button" as const, "aria-label": label, onClick, draggable: isDraggable, onDragStart, onDragOver, onDrop }
    : { "aria-label": label, draggable: isDraggable, onDragStart, onDragOver, onDrop };

  const cardScaleClass =
    size === "mobileLarge"
      ? "scale-[0.26] xs:scale-[0.28] sm:scale-[0.3] md:scale-[0.25]"
      : "scale-[0.18] xs:scale-[0.2] sm:scale-[0.22] md:scale-[0.25]";

  if (!card) {
    return (
        <Wrapper
        {...wrapperProps}
        className={`${emptyContainerClass} flex items-center justify-center text-center text-[8px] sm:text-[10px] font-semibold text-cyan-100/20 hover:text-cyan-100/50 hover:bg-cyan-950/30`}
      >
        <span className="opacity-50 font-mono tracking-widest">SLOT<br/>{label.split(' ')[1]}</span>
      </Wrapper>
    );
  }

  const masteryPassiveLabel = resolveMasteryPassiveLabel(masteryPassiveSkillId);

  return (
    <Wrapper {...wrapperProps} className={filledContainerClass}>
      {/* Contenedor centralizado para la miniatura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`${cardScaleClass} origin-center`}>
          <Card
            card={card}
            versionTier={versionTier}
            level={level}
            xp={xp}
            masteryPassiveLabel={masteryPassiveLabel}
            disableHoverEffects={isPerformanceMode}
            disableDefaultShadow={isPerformanceMode}
            isPerformanceMode={isPerformanceMode}
          />
        </div>
      </div>
    </Wrapper>
  );
}
