import Image from "next/image";
import { Cpu, Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";
import { CARD_CLIP_PATHS } from "./styles";

interface CardFrameProps {
  card: ICard;
  factionStyles: { wrapper: string; inner: string };
  isSelected: boolean;
  isOnBoard: boolean;
  onClick?: (card: ICard) => void;
}

export function CardFrame({ card, factionStyles, isSelected, isOnBoard, onClick }: CardFrameProps) {
  const isExecution = card.type === "EXECUTION";

  return (
    <div
      onClick={() => onClick?.(card)}
      style={{ clipPath: CARD_CLIP_PATHS.outer }}
      className={cn(
        "absolute inset-0 p-[2px] cursor-pointer select-none transition-all duration-300",
        isSelected
          ? "shadow-[0_0_50px_rgba(34,211,238,0.8)] ring-2 ring-cyan-400 ring-offset-black bg-gradient-to-br from-cyan-400 via-white to-blue-500"
          : `shadow-2xl shadow-black ${factionStyles.wrapper}`,
      )}
    >
      <div
        style={{ clipPath: CARD_CLIP_PATHS.inner }}
        className={cn("w-full h-full relative flex flex-col justify-between bg-gradient-to-br overflow-hidden", factionStyles.inner)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] bg-[length:200%_200%] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />

        <div className="flex justify-between items-start px-2 pt-2 relative z-10">
          <div
            className="flex items-center justify-center w-12 h-12 bg-black border border-yellow-500/80 text-yellow-400 font-black z-10 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
            style={{ clipPath: "polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)" }}
          >
            <Zap className="absolute opacity-20 w-8 h-8" />
            <span className="relative z-10 text-xl">{card.cost}</span>
          </div>
          <div className="bg-black/90 px-3 py-1.5 text-[10px] font-black tracking-widest text-white/70 uppercase border border-white/10 rounded-sm">
            {card.type}
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center relative z-10 mt-2 px-3">
          <div className="w-full h-32 mb-2 flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,1)] relative overflow-hidden group rounded-sm bg-black">
            {card.bgUrl && <Image src={card.bgUrl} alt="" fill sizes="260px" className="absolute inset-0 object-cover z-0" />}
            <div className="absolute inset-0 mix-blend-overlay bg-cyan-500/10 z-0" />
            {!isOnBoard && card.renderUrl && (
              <Image
                src={card.renderUrl}
                alt={card.name}
                fill
                sizes="260px"
                className="absolute inset-0 object-contain p-1 z-10 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] scale-110"
              />
            )}
            <div className="absolute top-0 w-full h-0.5 bg-cyan-400/50 opacity-0 group-hover:opacity-100 group-hover:animate-[ping_2s_infinite]" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tighter uppercase w-full text-center truncate drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">
            {card.name}
          </h2>
        </div>

        <div className="bg-black/80 border-t border-white/10 p-3 relative z-10 flex flex-col justify-between h-[105px]">
          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed line-clamp-3">{card.description}</p>
          <div className="flex justify-between items-end mt-1">
            {!isExecution ? (
              <>
                <div className="flex items-center space-x-2 text-red-500 font-black text-2xl">
                  <Sword className="w-5 h-5" />
                  <span>{card.attack ?? 0}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-500 font-black text-2xl">
                  <Shield className="w-5 h-5" />
                  <span>{card.defense ?? 0}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center w-full justify-center space-x-2 text-purple-400 font-black text-lg tracking-widest">
                <Cpu className="w-5 h-5" />
                <span>SCRIPT_EXEC</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
