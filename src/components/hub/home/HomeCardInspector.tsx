// src/components/hub/home/HomeCardInspector.tsx - Panel lateral para previsualizar la carta seleccionada en Arsenal.
"use client";

import { useEffect, useRef, useState } from "react";
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
  const cardViewportRef = useRef<HTMLDivElement | null>(null);
  const [cardScale, setCardScale] = useState(0.76);
  const masteryPassiveLabel = resolveMasteryPassiveLabel(selectedCardMasteryPassiveSkillId);
  const detailDescription =
    selectedCardVersionTier >= 5 && masteryPassiveLabel
      ? `${masteryPassiveLabel}\n\n${selectedCard?.description ?? ""}`
      : (selectedCard?.description ?? "");

  useEffect(() => {
    const viewport = cardViewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;

    // Ajusta la carta al ancho real disponible para evitar recorte en resoluciones compactas.
    const syncScale = (contentWidth: number): void => {
      const nextScale = Math.max(0.5, Math.min(0.9, contentWidth / 260));
      setCardScale(nextScale);
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncScale(entry.contentRect.width);
    });
    observer.observe(viewport);
    syncScale(viewport.clientWidth);
    return () => observer.disconnect();
  }, []);

  return (
    <aside data-tutorial-id="tutorial-home-inspector" className="relative flex h-full min-h-0 flex-col overflow-visible rounded-2xl border border-cyan-900/45 bg-[linear-gradient(180deg,#041325_0%,#020a14_100%)] p-4 shadow-[0_0_24px_rgba(8,145,178,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.08),transparent_50%)]" />
      <h2 className="relative mb-2 text-sm font-black uppercase tracking-widest text-cyan-200">Detalle</h2>
      {selectedCard ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div ref={cardViewportRef} className="mx-auto flex w-full justify-center overflow-visible">
            <div className="origin-top" style={{ transform: `scale(${cardScale})` }}>
            <Card
              card={selectedCard}
              versionTier={selectedCardVersionTier}
              level={selectedCardLevel}
              xp={selectedCardXp}
              masteryPassiveLabel={masteryPassiveLabel}
            />
            </div>
          </div>
          <p className="mt-2 pb-1 text-lg font-black uppercase text-cyan-100">{selectedCard.name}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-cyan-300/80">
            {selectedCard.type} · {selectedCard.faction}
          </p>
          <div className="home-modern-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{detailDescription}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Selecciona una carta del deck o del almacén.</p>
      )}
    </aside>
  );
}
