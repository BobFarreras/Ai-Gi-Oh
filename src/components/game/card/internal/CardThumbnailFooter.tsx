// src/components/game/card/internal/CardThumbnailFooter.tsx - Footer estático de la miniatura de carta con stats de combate o sello de magia.
import { Cpu, Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";

interface CardThumbnailFooterProps {
  card: ICard;
}

/**
 * Réplica en miniatura del CardFrameFooter: ATK/DEF para entidades
 * y sello MAGIA para ejecuciones. Sin animaciones ni números animados.
 */
export function CardThumbnailFooter({ card }: CardThumbnailFooterProps) {
  const isExecution = card.type === "EXECUTION";

  return (
    <div className="z-10 flex w-full items-center justify-between border-t border-white/10 bg-black/80 px-1 py-0.5">
      {!isExecution ? (
        <>
          <span className="flex items-center gap-0.5 text-[7px] font-black leading-none text-red-500">
            <Sword className="h-2 w-2" aria-hidden />
            {card.attack ?? 0}
          </span>
          <span className="flex items-center gap-0.5 text-[7px] font-black leading-none text-blue-500">
            <Shield className="h-2 w-2" aria-hidden />
            {card.defense ?? 0}
          </span>
        </>
      ) : (
        <>
          <span className="flex items-center gap-0.5 text-[6px] font-black tracking-widest text-purple-300">
            <Cpu className="h-2 w-2" aria-hidden />
            MAGIA
          </span>
          <span className="flex items-center gap-0.5 text-[6px] font-black text-emerald-300">
            <Zap className="h-2 w-2" aria-hidden />
            {card.effect?.action === "DAMAGE" ? card.effect.value : 0}
          </span>
        </>
      )}
    </div>
  );
}
