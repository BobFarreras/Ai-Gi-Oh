// src/components/game/card/internal/CardFrameArtAndProgress.tsx - Bloque central con arte, nombre y progreso de nivel.
import Image from "next/image";
import { ICard } from "@/core/entities/ICard";

interface CardFrameArtAndProgressProps {
  card: ICard;
  isOnBoard: boolean;
  level: number;
  levelProgressWidth: string;
  disableHoverEffects?: boolean;
  isPerformanceMode?: boolean;
}

export function CardFrameArtAndProgress({
  card,
  isOnBoard,
  level,
  levelProgressWidth,
  disableHoverEffects = false,
  isPerformanceMode = false,
}: CardFrameArtAndProgressProps) {
  const renderImageSizes = isPerformanceMode ? "96px" : "260px";
  const renderImageQuality = isPerformanceMode ? 55 : 75;
  return (
    <div className="relative z-10 mt-2 flex flex-grow flex-col items-center justify-start px-3">
      <div className="group relative mb-1.5 flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-sm bg-black shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
        {!isPerformanceMode && card.bgUrl ? <Image src={card.bgUrl} alt="" fill sizes="260px" className="absolute inset-0 z-0 object-cover" /> : null}
        {!isPerformanceMode ? <div className="absolute inset-0 z-0 bg-cyan-500/10 mix-blend-overlay" /> : null}
        {!isOnBoard && card.renderUrl && (
          isPerformanceMode ? (
            <Image
              src={card.renderUrl}
              alt={card.name}
              fill
              loading="lazy"
              sizes="96px"
              quality={40}
              className="absolute inset-0 z-10 object-contain p-1"
            />
          ) : (
            <Image
              src={card.renderUrl}
              alt={card.name}
              fill
              sizes={renderImageSizes}
              quality={renderImageQuality}
              className="absolute inset-0 z-10 object-contain p-1 drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)]"
            />
          )
        )}
        {!disableHoverEffects && !isPerformanceMode ? (
          <div className="absolute top-0 h-0.5 w-full bg-cyan-400/50 opacity-0 group-hover:animate-[ping_2s_infinite] group-hover:opacity-100" />
        ) : null}
      </div>
      <div className="flex w-full flex-1 items-center justify-center py-1">
        <h2 className={isPerformanceMode ? "line-clamp-2 w-full text-center text-[17px] font-black uppercase leading-tight tracking-tight text-white" : "line-clamp-2 w-full text-center text-[17px] font-black uppercase leading-tight tracking-tight text-white drop-shadow-[0_2px_5px_rgba(0,0,0,1)]"}>
          {card.name}
        </h2>
      </div>
      <div className="mb-1 mt-1 flex w-full items-center gap-2">
        <span className={isPerformanceMode ? "shrink-0 text-[11px] font-black italic text-cyan-300" : "shrink-0 text-[11px] font-black italic text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"}>LVL {level}</span>
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full border border-cyan-900/50 bg-black shadow-[inset_0_0_5px_rgba(0,0,0,0.8)]">
          <div
            className="absolute left-0 top-0 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-[width] duration-500"
            style={{ width: levelProgressWidth }}
          />
        </div>
      </div>
    </div>
  );
}

