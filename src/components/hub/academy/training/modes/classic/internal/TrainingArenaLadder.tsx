// src/components/hub/academy/training/modes/classic/internal/TrainingArenaLadder.tsx - Visualiza el avance frente al roster del nivel.
import Image from "next/image";

interface ITrainingArenaLadderProps {
  entries: Array<{ displayName: string; avatarUrl: string }>;
  wins: number;
}

/** Distingue rivales vencidos, siguiente rival y combates todavía bloqueados. */
export function TrainingArenaLadder({ entries, wins }: ITrainingArenaLadderProps) {
  if (entries.length === 0) return null;
  return (
    <div className="relative mt-2.5 flex flex-col items-center gap-1 border-t border-cyan-300/15 pt-2">
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300/70 md:text-[10px]">
        Combate {Math.min(wins + 1, entries.length)} de {entries.length}
      </span>
      <div className="flex items-center justify-center gap-1.5 md:gap-2.5">
        {entries.map((entry, index) => {
          const isBeaten = index < wins;
          const isNext = index === wins;
          const stateClass = isBeaten
            ? "border-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            : isNext
              ? "border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.65)] ring-2 ring-cyan-300/50"
              : "border-slate-600/50 opacity-45 grayscale";
          return (
            <div key={`${entry.displayName}-${index}`} title={entry.displayName} className={`relative h-7 w-7 shrink-0 overflow-hidden rounded-full border-2 transition md:h-11 md:w-11 ${stateClass}`}>
              <Image src={entry.avatarUrl} alt={entry.displayName} fill sizes="44px" className="object-cover object-top" />
              {isBeaten ? <span aria-label="Derrotado" className="absolute inset-0 flex items-center justify-center bg-emerald-500/35 text-lg font-black text-white">✓</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
