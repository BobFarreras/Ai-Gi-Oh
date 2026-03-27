// src/components/game/board/battlefield/internal/BattlefieldPiles.tsx - Renderiza pilas visuales de deck, fusión, cementerio y destrucción.
import { Card } from "@/components/game/card/Card";
import { CardBack } from "@/components/game/card/CardBack";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";

interface GraveyardPileProps {
  isOpponentSide: boolean;
  topGraveCard: ICard | null;
  graveyardCount: number;
  onClick: (side: "player" | "opponent") => void;
}

export function GraveyardPile({ isOpponentSide, topGraveCard, graveyardCount, onClick }: GraveyardPileProps) {
  const accentClass = isOpponentSide ? "border-red-500/40 bg-red-950/20" : "border-cyan-500/40 bg-cyan-950/20";
  const labelClass = isOpponentSide ? "text-red-400 border-red-500/30" : "text-cyan-400 border-cyan-500/30";
  const countClass = isOpponentSide ? "bg-red-900/90 border-red-500/50" : "bg-cyan-900/90 border-cyan-500/50";
  return (
    <button
      type="button"
      data-tutorial-id={isOpponentSide ? undefined : "tutorial-board-graveyard-player"}
      aria-label={`Abrir cementerio ${isOpponentSide ? "rival" : "jugador"}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(isOpponentSide ? "opponent" : "player");
      }}
      className={cn(
        "relative z-20 pointer-events-auto w-24 h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] overflow-hidden transition-colors hover:border-cyan-300/70",
        accentClass,
      )}
    >
      {topGraveCard && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="scale-[0.25] origin-center opacity-70 grayscale-[0.3]">
            <Card card={topGraveCard} />
          </div>
        </div>
      )}
      <span className={cn("relative z-10 font-black text-[10px] uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded mt-1 border", labelClass)}>
        Grave
      </span>
      <span className={cn("relative z-10 text-xs mt-1 font-mono font-black text-white border px-2 py-0.5 rounded shadow-lg", countClass)}>
        {graveyardCount}
      </span>
    </button>
  );
}

export function DeckPile({ deckCount }: { deckCount: number }) {
  return (
    <div className="relative w-24 h-36 border-2 border-zinc-700/80 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center bg-black/50 overflow-hidden">
      {deckCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="scale-[0.25] origin-center opacity-80">
            <CardBack />
          </div>
        </div>
      )}
      <span className="relative z-10 bg-black/90 px-3 py-1 rounded-md text-cyan-400 font-mono text-sm border border-cyan-900/80">
        {deckCount}
      </span>
    </div>
  );
}

interface FusionDeckPileProps {
  fusionDeckCount: number;
  isOpponentSide: boolean;
  onClick: (side: "player" | "opponent") => void;
}

export function FusionDeckPile({ fusionDeckCount, isOpponentSide, onClick }: FusionDeckPileProps) {
  if (isOpponentSide) {
    return (
      <div className="relative z-10 w-24 h-36 border-2 border-fuchsia-500/25 rounded-lg shadow-[0_0_24px_rgba(192,132,252,0.16)] flex flex-col items-center justify-center bg-fuchsia-950/15 overflow-hidden">
        {fusionDeckCount > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="scale-[0.25] origin-center opacity-60">
              <CardBack />
            </div>
          </div>
        )}
        <span className="relative z-10 bg-black/85 px-2.5 py-1 rounded-md text-fuchsia-300/80 font-mono text-xs border border-fuchsia-900/70">
          FUS {fusionDeckCount}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Abrir deck de fusión jugador"
      onClick={(event) => {
        event.stopPropagation();
        onClick("player");
      }}
      className="relative z-20 pointer-events-auto w-24 h-36 border-2 border-fuchsia-500/40 rounded-lg shadow-[0_0_28px_rgba(192,132,252,0.26)] flex flex-col items-center justify-center bg-fuchsia-950/20 overflow-hidden transition-colors hover:border-fuchsia-300/70"
    >
      {fusionDeckCount > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="scale-[0.25] origin-center opacity-80">
            <CardBack />
          </div>
        </div>
      )}
      <span className="relative z-10 bg-black/90 px-2.5 py-1 rounded-md text-fuchsia-300 font-mono text-xs border border-fuchsia-900/80">
        FUS {fusionDeckCount}
      </span>
    </button>
  );
}

interface DestroyedPileProps {
  isOpponentSide: boolean;
  destroyedCount: number;
  onClick: (side: "player" | "opponent") => void;
}

export function DestroyedPile({ isOpponentSide, destroyedCount, onClick }: DestroyedPileProps) {
  const side = isOpponentSide ? "opponent" : "player";
  return (
    <button
      type="button"
      aria-label={`Abrir zona destruida ${isOpponentSide ? "rival" : "jugador"}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(side);
      }}
      className="relative z-20 pointer-events-auto w-24 h-36 border-2 border-amber-500/40 rounded-lg shadow-[0_0_28px_rgba(245,158,11,0.24)] flex flex-col items-center justify-center bg-amber-950/20 overflow-hidden transition-colors hover:border-amber-300/70"
    >
      <span className="relative z-10 bg-black/90 px-2 py-1 rounded-md text-amber-300 font-mono text-[11px] border border-amber-900/80">
        DEST {destroyedCount}
      </span>
    </button>
  );
}
