// src/components/game/card/internal/CardFrameFooter.tsx - Bloque inferior con descripción fija y estadísticas de combate.
import { Cpu, Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";

interface CardFrameFooterProps {
  card: ICard;
  descriptionText: string;
}

export function CardFrameFooter({ card, descriptionText }: CardFrameFooterProps) {
  const isExecution = card.type === "EXECUTION";

  return (
    <div className="relative z-10 flex h-[108px] flex-col justify-between border-t border-white/10 bg-black/80 p-3">
      <div className="card-description-scroll h-[42px] overflow-y-auto pr-1">
        <p className="text-[10px] font-mono leading-relaxed text-zinc-300 whitespace-pre-line">{descriptionText}</p>
      </div>
      <div className="mt-0.5 flex items-end justify-between">
        {!isExecution ? (
          <>
            <div className="flex items-center space-x-2 text-2xl font-black text-red-500">
              <Sword className="h-5 w-5" />
              <span>{card.attack ?? 0}</span>
            </div>
            <div className="flex items-center space-x-2 text-2xl font-black text-blue-500">
              <Shield className="h-5 w-5" />
              <span>{card.defense ?? 0}</span>
            </div>
          </>
        ) : (
          <div className="flex w-full items-center justify-between text-xs font-black tracking-widest text-purple-300">
            <div className="flex items-center space-x-1">
              <Cpu className="h-3.5 w-3.5" />
              <span>MAGIA</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-300">
              <Zap className="h-3.5 w-3.5" />
              <span>{card.effect?.action === "DAMAGE" ? card.effect.value : 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
