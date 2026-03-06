// src/components/game/CardBack.tsx
import { cn } from "@/lib/utils";

interface CardBackProps {
  className?: string;
  isHorizontal?: boolean; // Para contrarrestar la rotación cuando está en modo SET en el tablero
}

export function CardBack({ className, isHorizontal = false }: CardBackProps) {
  return (
    <div 
      className={cn(
        "relative w-[260px] h-[340px] rounded-2xl bg-zinc-950 border-4 border-cyan-800",
        "bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(6,182,212,0.1)_10px,rgba(6,182,212,0.1)_20px)]",
        "shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden select-none",
        className
      )}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
      
      {/* Núcleo Holográfico */}
      <div className="relative w-32 h-32 rounded-full border-4 border-cyan-500/50 flex items-center justify-center bg-black/90 z-10 shadow-[0_0_30px_rgba(6,182,212,0.8)]">
        <div className="absolute inset-0 rounded-full border border-cyan-300/30 animate-[ping_3s_infinite]" />
        <span 
          className={cn(
            "text-cyan-400 font-black text-2xl tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] text-center leading-tight transition-transform duration-300",
            isHorizontal ? "rotate-90" : "rotate-0"
          )}
        >
          AI-GI<br/>OH!
        </span>
      </div>
    </div>
  );
}