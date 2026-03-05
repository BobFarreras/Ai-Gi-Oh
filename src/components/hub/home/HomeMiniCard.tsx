// src/components/hub/home/HomeMiniCard.tsx
"use client";

import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";

interface HomeMiniCardProps {
  card: ICard | null;
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function HomeMiniCard({ card, label, isSelected = false, onClick }: HomeMiniCardProps) {
  // REFACTOR CLAVE: "w-full aspect-[3/4]" hace que la carta sea 100% fluida y no se solape
  const containerClass = isSelected
    ? "relative w-full aspect-[3/4] rounded-md sm:rounded-lg border-2 border-amber-400 bg-[#0a1320] shadow-[0_0_15px_rgba(251,191,36,0.3)] overflow-hidden transition-all"
    : "relative w-full aspect-[3/4] rounded-md sm:rounded-lg border border-cyan-900/55 bg-[#081220] overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer";

  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { type: "button" as const, "aria-label": label, onClick }
    : { "aria-label": label };

  if (!card) {
    return (
      <Wrapper
        {...wrapperProps}
        className={`${containerClass} flex items-center justify-center text-center text-[8px] sm:text-[10px] font-semibold text-cyan-100/20 hover:text-cyan-100/50 hover:bg-cyan-950/30`}
      >
        <span className="opacity-50 font-mono tracking-widest">SLOT<br/>{label.split(' ')[1]}</span>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} className={containerClass}>
      {/* Contenedor centralizado para la miniatura */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Usamos clases responsivas de Tailwind para reducir el scale en pantallas pequeñas */}
        <div className="scale-[0.20] xs:scale-[0.24] sm:scale-[0.28] md:scale-[0.32] origin-center">
          <Card card={card} />
        </div>
      </div>
    </Wrapper>
  );
}