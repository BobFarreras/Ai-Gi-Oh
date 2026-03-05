// src/components/game/card/internal/CardFrameHeader.tsx - Cabecera de carta con energía, versión y badge de tipo.
import { Bot, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";
import { resolveEntityArchetypeMeta, resolveTypeBadge } from "./card-frame-meta";

interface CardFrameHeaderProps {
  card: ICard;
  versionTier: number;
}

export function CardFrameHeader({ card, versionTier }: CardFrameHeaderProps) {
  const archetypeMeta = card.type === "ENTITY" ? resolveEntityArchetypeMeta(card.archetype) : null;
  const ArchetypeIcon = (archetypeMeta?.Icon ?? Bot) as typeof Bot;

  return (
    <div className="relative z-10 flex items-start justify-between px-2 pt-2">
      <div className="flex items-center gap-1.5">
        <div
          className="z-10 flex h-12 w-12 shrink-0 items-center justify-center border border-yellow-500/80 bg-black font-black text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
          style={{ clipPath: "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)" }}
        >
          <Zap className="absolute h-8 w-8 opacity-20" />
          <span className="relative z-10 text-xl">{card.cost}</span>
        </div>
        <div className="ml-1 flex items-baseline drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]">
          <span className="mr-0.5 text-sm font-black italic text-amber-500/90">V</span>
          <span className="text-3xl font-black italic leading-none tracking-tighter text-white">{versionTier}</span>
        </div>
      </div>
      <div
        aria-label="Tipo de carta"
        className="ml-auto flex h-[26px] w-max max-w-[110px] shrink-0 items-center justify-end gap-1.5 rounded border border-white/10 bg-black/90 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/80"
      >
        {archetypeMeta ? (
          <span className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border", archetypeMeta.chipClass)}>
            <ArchetypeIcon className="h-2.5 w-2.5" />
          </span>
        ) : null}
        <span className="truncate">{resolveTypeBadge(card)}</span>
      </div>
    </div>
  );
}

