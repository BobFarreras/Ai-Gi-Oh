// src/components/hub/home/HomeCardInspector.tsx - Panel lateral para previsualizar la carta seleccionada en Mi Home.
import { ICard } from "@/core/entities/ICard";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";
import { Card } from "@/components/game/card/Card";

interface HomeCardInspectorProps {
  selectedCard: ICard | null;
  selectedCardVersionTier: number;
  selectedCardLevel: number;
  selectedCardXp: number;
  selectedCardMasteryPassiveSkillId: string | null;
}

export function HomeCardInspector({
  selectedCard,
  selectedCardVersionTier,
  selectedCardLevel,
  selectedCardXp,
  selectedCardMasteryPassiveSkillId,
}: HomeCardInspectorProps) {
  const masteryPassiveLabel = resolveMasteryPassiveLabel(selectedCardMasteryPassiveSkillId);
  const detailDescription =
    selectedCardVersionTier >= 5 && masteryPassiveLabel
      ? `${masteryPassiveLabel}\n\n${selectedCard?.description ?? ""}`
      : (selectedCard?.description ?? "");

  return (
    <aside className="h-full overflow-hidden rounded-2xl border border-cyan-900/45 bg-[#030c16]/86 p-4 shadow-[0_0_24px_rgba(8,145,178,0.14)]">
      <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-200">Detalle</h2>
      {selectedCard ? (
        <>
          <div className="mx-auto w-fit origin-top scale-[0.78]">
            <Card
              card={selectedCard}
              versionTier={selectedCardVersionTier}
              level={selectedCardLevel}
              xp={selectedCardXp}
              masteryPassiveLabel={masteryPassiveLabel}
            />
          </div>
          <p className="-mt-12 text-lg font-black uppercase text-cyan-100">{selectedCard.name}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-cyan-300/80">
            {selectedCard.type} · {selectedCard.faction}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">{detailDescription}</p>
        </>
      ) : (
        <p className="text-xs text-slate-400">Selecciona una carta del deck o del almacén.</p>
      )}
    </aside>
  );
}
