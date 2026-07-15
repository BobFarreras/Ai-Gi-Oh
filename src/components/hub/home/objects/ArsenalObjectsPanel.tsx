// src/components/hub/home/objects/ArsenalObjectsPanel.tsx - Sección de OBJETOS del arsenal: SOLO objetos (con su
// imagen), no cartas. Dos flujos de equipar:
//   Flujo A: se entra con una carta objetivo (desde "Equipar objeto" del detalle) → clic en objeto = aplicar.
//   Flujo B: se entra sin objetivo → clic en objeto = detalle grande + "Equipar" → va a Cartas a elegir carta.
"use client";

import Image from "next/image";
import { ReactNode, useState } from "react";
import { Package } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { ISelectableObject } from "@/components/hub/home/objects/arsenal-objects-shared";

interface IArsenalObjectsPanelProps {
  objects: ISelectableObject[];
  isLoading: boolean;
  /** Carta objetivo del flujo A (null = flujo B: elegir objeto primero). */
  targetCard: ICard | null;
  /** true si el objeto es aplicable a la carta objetivo (flujo A). Se ignora en flujo B. */
  canApplyToTarget: (object: ISelectableObject) => boolean;
  sectionSwitch: ReactNode;
  /** Flujo A: aplicar el objeto a la carta objetivo. */
  onApplyToTarget: (object: ISelectableObject) => void;
  /** Flujo B: elegir este objeto para equiparlo (lleva a Cartas). */
  onEquipObject: (object: ISelectableObject) => void;
}

/** Detalle grande de un objeto con el botón "Equipar" (flujo B). */
function ObjectDetail({ object, onEquip, onClose }: { object: ISelectableObject; onEquip: () => void; onClose: () => void }) {
  const Icon = object.icon;
  return (
    <div className="absolute inset-0 z-[30] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl border border-amber-400/50 bg-[#0a0703]/97 p-5 text-center shadow-[0_0_45px_rgba(251,191,36,0.28)]" onClick={(event) => event.stopPropagation()}>
        <div className="relative mx-auto h-32 w-32">
          {object.imageUrl ? <Image src={object.imageUrl} alt="" fill sizes="128px" className="object-contain" /> : <Icon className="h-full w-full text-amber-400/60" aria-hidden />}
        </div>
        <p className="mt-3 font-display text-lg font-black uppercase tracking-wide text-amber-100">{object.name}</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-amber-300/90">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {object.detail} · tienes {object.owned}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onEquip}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 font-display text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.4)] transition hover:from-amber-400 hover:to-yellow-300"
          >
            Equipar
          </button>
          <button type="button" onClick={onClose} className="h-10 w-full rounded-lg border border-zinc-600/70 font-display text-xs font-black uppercase tracking-wide text-zinc-300 transition hover:border-zinc-400">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ArsenalObjectsPanel({ objects, isLoading, targetCard, canApplyToTarget, sectionSwitch, onApplyToTarget, onEquipObject }: IArsenalObjectsPanelProps) {
  const [detailObject, setDetailObject] = useState<ISelectableObject | null>(null);

  const handleObjectClick = (object: ISelectableObject) => {
    if (targetCard) {
      if (canApplyToTarget(object)) onApplyToTarget(object);
      return;
    }
    // Flujo B: abre el detalle grande con "Equipar".
    setDetailObject(object);
  };

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col gap-3">
      {/* El conmutador SIEMPRE a la izquierda (misma posición que en la sección Cartas); el título a la derecha. */}
      <div className="flex items-center justify-between gap-2">
        {sectionSwitch}
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base font-black uppercase tracking-[0.16em] text-amber-100">Objetos</h2>
          <Package className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
      </div>

      {targetCard ? (
        <p className="shrink-0 rounded-lg border border-amber-400/40 bg-[#1a1206]/60 px-3 py-2 text-center text-xs text-amber-100">
          Elige el objeto para <span className="font-black">{targetCard.name}</span>
        </p>
      ) : (
        <p className="shrink-0 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Toca un objeto para equiparlo, o pulsa <span className="text-amber-300">Equipar objeto</span> en el detalle de una carta
        </p>
      )}

      {isLoading ? (
        <p className="m-auto font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando objetos…</p>
      ) : objects.length === 0 ? (
        <div className="m-auto max-w-sm text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-amber-100">No tienes objetos</p>
          <p className="mt-1 text-xs text-slate-400">Consíguelos en la sección Objetos del Mercado: el USB Raro sube de nivel y las mejoras dan ATK/DEF permanente.</p>
        </div>
      ) : (
        <ul className="home-modern-scroll grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {objects.map((object) => {
            const Icon = object.icon;
            // Sin opacidad: en flujo B todos son tocables; en flujo A el no-aplicable solo se marca con "tope".
            const blockedForTarget = Boolean(targetCard) && !canApplyToTarget(object);
            return (
              <li key={object.id}>
                <button
                  type="button"
                  onClick={() => handleObjectClick(object)}
                  aria-label={targetCard ? `Usar ${object.name} en ${targetCard.name}` : `Ver ${object.name}`}
                  className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-amber-400/45 bg-[#0a0703]/70 p-3 text-center transition hover:border-amber-300 hover:bg-amber-500/15"
                >
                  <div className="relative h-20 w-20">
                    {object.imageUrl ? <Image src={object.imageUrl} alt="" fill sizes="80px" className="object-contain" /> : <Icon className="h-full w-full text-amber-400/60" aria-hidden />}
                  </div>
                  <span className="font-display text-xs font-black uppercase leading-tight text-amber-100">{object.name}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
                    <Icon className="h-3 w-3 text-amber-300" aria-hidden />
                    {object.detail} · x{object.owned}
                  </span>
                  {blockedForTarget ? <span className="font-mono text-[8px] uppercase tracking-widest text-rose-300/80">tope alcanzado</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {detailObject ? (
        <ObjectDetail
          object={detailObject}
          onEquip={() => { const object = detailObject; setDetailObject(null); onEquipObject(object); }}
          onClose={() => setDetailObject(null)}
        />
      ) : null}
    </div>
  );
}
