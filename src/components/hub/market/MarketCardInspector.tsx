// src/components/hub/market/MarketCardInspector.tsx - Panel lateral de detalle de carta seleccionada en mercado.
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";

interface MarketCardInspectorProps {
  selectedCard: ICard | null;
}

export function MarketCardInspector({ selectedCard }: MarketCardInspectorProps) {
  return (
    <aside className="h-full overflow-hidden rounded-2xl border border-cyan-900/45 bg-[#030c16]/86 p-4 shadow-[0_0_24px_rgba(8,145,178,0.14)]">
      <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-cyan-200">Detalle</h2>
      {selectedCard ? (
        <>
          <div className="mx-auto w-fit origin-top scale-[0.74]">
            <Card card={selectedCard} />
          </div>
          <p className="-mt-14 text-lg font-black uppercase text-cyan-100">{selectedCard.name}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-cyan-300/80">
            {selectedCard.type} · Coste {selectedCard.cost}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{selectedCard.description}</p>
        </>
      ) : (
        <p className="text-xs text-slate-400">Selecciona una carta del catálogo o del sobre abierto.</p>
      )}
    </aside>
  );
}
