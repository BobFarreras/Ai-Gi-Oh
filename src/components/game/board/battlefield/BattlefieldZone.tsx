import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Card } from "../../card/Card";
import { CardBack } from "../../card/CardBack";
import { SlotGrid } from "./SlotGrid";

interface BattlefieldZoneProps {
  side: "opponent" | "player";
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
  deckCount: number;
  topGraveCard: ICard | null;
  graveyardCount: number;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  revealedEntities: string[];
  highlightedEntityIds: string[];
  shouldDamageFlash: boolean;
  damageEventId: string | null;
  buffedEntityIds: string[];
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number | null;
  buffEventId: string | null;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => void;
}

export function BattlefieldZone({
  side,
  activeEntities,
  activeExecutions,
  deckCount,
  topGraveCard,
  graveyardCount,
  activeAttackerId,
  selectedCard,
  revealedEntities,
  highlightedEntityIds,
  shouldDamageFlash,
  damageEventId,
  buffedEntityIds,
  buffStat,
  buffAmount,
  buffEventId,
  onGraveyardClick,
  onEntityClick,
}: BattlefieldZoneProps) {
  const isOpponentSide = side === "opponent";
  const accent = isOpponentSide ? "red" : "cyan";
  const zonePadding = isOpponentSide ? "mb-4" : "mt-4";
  const [isDamageFlashing, setIsDamageFlashing] = useState(false);

  useEffect(() => {
    if (!shouldDamageFlash || !damageEventId) {
      return;
    }
    const startId = setTimeout(() => setIsDamageFlashing(true), 0);
    const timeoutId = setTimeout(() => setIsDamageFlashing(false), 850);
    return () => {
      clearTimeout(startId);
      clearTimeout(timeoutId);
    };
  }, [damageEventId, shouldDamageFlash]);

  return (
    <div
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "flex w-full justify-center items-center gap-8 z-10 p-4 rounded-2xl transition-colors duration-300",
        zonePadding,
        isDamageFlashing ? "bg-red-900/35 shadow-[0_0_40px_rgba(239,68,68,0.4)_inset]" : "",
      )}
    >
      <button
        type="button"
        aria-label={`Abrir cementerio ${isOpponentSide ? "rival" : "jugador"}`}
        onClick={() => onGraveyardClick(isOpponentSide ? "opponent" : "player")}
        className={cn(
          "relative w-24 h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] overflow-hidden transition-colors hover:border-cyan-300/70",
          accent === "red" ? "border-red-500/40 bg-red-950/20" : "border-cyan-500/40 bg-cyan-950/20",
        )}
      >
        {topGraveCard && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="scale-[0.25] origin-center opacity-70 grayscale-[0.3]">
              <Card card={topGraveCard} />
            </div>
          </div>
        )}
        <span
          className={cn(
            "relative z-10 font-black text-[10px] uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded mt-1 border",
            accent === "red" ? "text-red-400 border-red-500/30" : "text-cyan-400 border-cyan-500/30",
          )}
        >
          Grave
        </span>
        <span
          className={cn(
            "relative z-10 text-xs mt-1 font-mono font-black text-white border px-2 py-0.5 rounded shadow-lg",
            accent === "red" ? "bg-red-900/90 border-red-500/50" : "bg-cyan-900/90 border-cyan-500/50",
          )}
        >
          {graveyardCount}
        </span>
      </button>

      <div className="flex flex-col gap-3" style={{ transformStyle: "preserve-3d" }}>
        <div className={cn("flex gap-3", isOpponentSide ? "opacity-60" : "")} style={{ transformStyle: "preserve-3d" }}>
          <SlotGrid
            entities={isOpponentSide ? activeExecutions : activeEntities}
            totalSlots={3}
            isOpponentSide={isOpponentSide}
            activeAttackerId={activeAttackerId}
            selectedCard={selectedCard}
            revealedEntities={revealedEntities}
            highlightedEntityIds={highlightedEntityIds}
            buffedEntityIds={buffedEntityIds}
            buffStat={buffStat}
            buffAmount={buffAmount}
            buffEventId={buffEventId}
            onEntityClick={onEntityClick}
          />
        </div>
        <div className={cn("flex gap-3", isOpponentSide ? "" : "opacity-60")} style={{ transformStyle: "preserve-3d" }}>
          <SlotGrid
            entities={isOpponentSide ? activeEntities : activeExecutions}
            totalSlots={3}
            isOpponentSide={isOpponentSide}
            activeAttackerId={activeAttackerId}
            selectedCard={selectedCard}
            revealedEntities={revealedEntities}
            highlightedEntityIds={highlightedEntityIds}
            buffedEntityIds={buffedEntityIds}
            buffStat={buffStat}
            buffAmount={buffAmount}
            buffEventId={buffEventId}
            onEntityClick={onEntityClick}
          />
        </div>
      </div>

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
    </div>
  );
}
