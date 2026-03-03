import { Sword } from "lucide-react";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";

interface CombatLogCardsStripProps {
  cards: ICard[];
  onCardClick?: (card: ICard) => void;
}

function CardPreviewButton({ card, onCardClick }: { card: ICard; onCardClick?: (card: ICard) => void }) {
  return (
    <button aria-label={`Ver carta ${card.name}`} onClick={() => onCardClick?.(card)} className="min-w-[76px] hover:opacity-100">
      <div className="scale-[0.2] origin-top-left w-[52px] h-[68px]">
        <Card card={card} />
      </div>
    </button>
  );
}

export function CombatLogBattleStrip({
  attackerCard,
  defenderCard,
  winnerText,
  onCardClick,
}: {
  attackerCard: ICard;
  defenderCard: ICard;
  winnerText: string | null;
  onCardClick?: (card: ICard) => void;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
        <CardPreviewButton card={attackerCard} onCardClick={onCardClick} />
        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-red-500/50 bg-red-950/50">
          <Sword className="w-4 h-4 text-red-300" />
        </div>
        <CardPreviewButton card={defenderCard} onCardClick={onCardClick} />
      </div>
      {winnerText && <p className="text-[10px] text-zinc-200 mt-1 font-bold">{winnerText}.</p>}
    </div>
  );
}

export function CombatLogDirectAttackStrip({
  attackerCard,
  onCardClick,
}: {
  attackerCard: ICard;
  onCardClick?: (card: ICard) => void;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
        <CardPreviewButton card={attackerCard} onCardClick={onCardClick} />
        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-red-500/50 bg-red-950/50">
          <Sword className="w-4 h-4 text-red-300" />
        </div>
        <div className="min-w-[76px] h-[68px] rounded-md border border-red-500/45 bg-red-950/45 flex items-center justify-center">
          <p className="text-[10px] text-red-200 font-black tracking-widest uppercase">Directo</p>
        </div>
      </div>
      <p className="text-[10px] text-zinc-200 mt-1 font-bold">Ataque directo con {attackerCard.name}.</p>
    </div>
  );
}

export function CombatLogCardsStrip({ cards, onCardClick }: CombatLogCardsStripProps) {
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
      {cards.map((card) => (
        <CardPreviewButton key={card.id} card={card} onCardClick={onCardClick} />
      ))}
    </div>
  );
}
