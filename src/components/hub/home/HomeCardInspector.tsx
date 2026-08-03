// src/components/hub/home/HomeCardInspector.tsx - Panel lateral para previsualizar la carta seleccionada en Arsenal.
"use client";

import { useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { resolveMasteryPassiveLabel } from "@/core/services/progression/mastery-passive-display";
import { Card } from "@/components/game/card/Card";
import { ICardUpgradeCounts } from "@/components/game/card/internal/card-frame-types";

interface HomeCardInspectorProps {
  selectedCard: ICard | null;
  selectedCardVersionTier: number;
  selectedCardLevel: number;
  selectedCardXp: number;
  selectedCardMasteryPassiveSkillId: string | null;
  minCardScale?: number;
  maxCardScale?: number;
  /** Acción de equipar del detalle. Flujo A ("Equipar objeto") o flujo B ("Activar {objeto}"). Solo Entity. */
  onEquip?: () => void;
  /** Nombre del objeto pendiente (flujo B): si está, el botón es "Activar {nombre}". */
  equipPendingObjectLabel?: string | null;
  /** Badges ×N de objetos aplicados a la carta seleccionada (rastro visible de la ficha 9b). */
  upgradeCounts?: ICardUpgradeCounts | null;
}

export function HomeCardInspector({
  selectedCard,
  selectedCardVersionTier,
  selectedCardLevel,
  selectedCardXp,
  selectedCardMasteryPassiveSkillId,
  minCardScale = 0.5,
  maxCardScale = 0.9,
  onEquip,
  equipPendingObjectLabel = null,
  upgradeCounts = null,
}: HomeCardInspectorProps) {
  const cardViewportRef = useRef<HTMLDivElement | null>(null);
  const [cardScale, setCardScale] = useState(0.76);
  const masteryPassiveLabel = resolveMasteryPassiveLabel(selectedCardMasteryPassiveSkillId, selectedCardVersionTier);
  // El poder se integra en la descripción tanto para pasivas de maestría (V5) como innatas (desde V0).
  const detailPassiveLabel = resolveMasteryPassiveLabel(
    selectedCardMasteryPassiveSkillId ?? selectedCard?.masteryPassiveSkillId ?? null,
    selectedCardVersionTier,
  );
  const detailDescription = detailPassiveLabel
    ? `${detailPassiveLabel}\n\n${selectedCard?.description ?? ""}`
    : (selectedCard?.description ?? "");

  useEffect(() => {
    const viewport = cardViewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;

    // Encaja la carta REAL (260x380) dentro del área disponible por ANCHO y ALTO (contain), para
    // que nunca se corte ni se salga, sea cual sea el contenedor (también en columnas compactas).
    const syncScale = (width: number, height: number): void => {
      const fit = Math.min(width / 260, height / 380);
      const nextScale = Math.max(minCardScale, Math.min(maxCardScale, fit));
      if (Number.isFinite(nextScale) && nextScale > 0) {
        setCardScale((currentScale) => Math.abs(currentScale - nextScale) < 0.01 ? currentScale : nextScale);
      }
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncScale(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(viewport);
    syncScale(viewport.clientWidth, viewport.clientHeight);
    return () => observer.disconnect();
  }, [maxCardScale, minCardScale]);

  return (
    <aside data-tutorial-id="tutorial-home-inspector" className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-900/45 bg-[linear-gradient(180deg,#041325_0%,#020a14_100%)] p-4 shadow-[0_0_24px_rgba(8,145,178,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.08),transparent_50%)]" />
      <h2 className="relative mb-2 shrink-0 text-sm font-black uppercase tracking-widest text-cyan-200">Detalle</h2>
      {selectedCard ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* La carta ocupa la mayor parte del espacio y se escala para caber ENTERA (ancho y alto).
              La caja toma el tamaño real escalado (transform:scale no afecta al layout) + origin-top-left. */}
          <div ref={cardViewportRef} className="flex min-h-0 flex-[2] items-center justify-center overflow-hidden">
            <div style={{ width: `${Math.round(260 * cardScale)}px`, height: `${Math.round(380 * cardScale)}px` }}>
              <div className="origin-top-left" style={{ transform: `scale(${cardScale})` }}>
                <Card
                  card={selectedCard}
                  versionTier={selectedCardVersionTier}
                  level={selectedCardLevel}
                  xp={selectedCardXp}
                  masteryPassiveLabel={masteryPassiveLabel}
                  upgradeCounts={upgradeCounts}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 shrink-0 pb-1 text-base font-black uppercase text-cyan-100 sm:text-lg">{selectedCard.name}</p>
          <p className="mt-1 shrink-0 text-[11px] uppercase tracking-widest text-cyan-300/80">
            {selectedCard.type} · {selectedCard.faction}
          </p>
          <div className="home-modern-scroll mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{detailDescription}</p>
          </div>
          {/* Equipar/Activar: solo Entity (las que suben ATK/DEF con nivel/mejoras). En flujo B (objeto ya
              elegido) el botón activa ese objeto; en flujo A lleva a elegir el objeto. */}
          {onEquip && selectedCard.type === "ENTITY" ? (
            <button
              type="button"
              onClick={onEquip}
              aria-label={equipPendingObjectLabel ? `Activar ${equipPendingObjectLabel} en ${selectedCard.name}` : `Equipar un objeto en ${selectedCard.name}`}
              className="mt-2 flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-400/60 bg-amber-900/25 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-800/35"
            >
              <Wrench size={14} />
              {equipPendingObjectLabel ? `Activar ${equipPendingObjectLabel}` : "Equipar objeto"}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Selecciona una carta del deck o del almacén.</p>
      )}
    </aside>
  );
}
