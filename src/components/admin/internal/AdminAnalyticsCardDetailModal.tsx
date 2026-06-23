// src/components/admin/internal/AdminAnalyticsCardDetailModal.tsx - Modal de detalle de carta (imagen + stats) para los rankings de analytics. Datos del catálogo en código.
"use client";

import Image from "next/image";
import { ICard } from "@/core/entities/ICard";

const TYPE_LABEL: Record<string, string> = {
  ENTITY: "Entidad",
  EXECUTION: "Ejecución",
  TRAP: "Trampa",
  FUSION: "Fusión",
  ENVIRONMENT: "Entorno",
};

const FACTION_LABEL: Record<string, string> = {
  OPEN_SOURCE: "Open Source",
  BIG_TECH: "Big Tech",
  NO_CODE: "No-Code",
  NEUTRAL: "Neutral",
};

interface IAdminAnalyticsCardDetailModalProps {
  card: ICard;
  usageCount: number;
  onClose: () => void;
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-center">
      <p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-bold text-cyan-100">{value}</p>
    </div>
  );
}

export function AdminAnalyticsCardDetailModal({ card, usageCount, onClose }: IAdminAnalyticsCardDetailModalProps) {
  const imageUrl = card.renderUrl ?? card.bgUrl ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${card.name}`}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-cyan-100">{card.name}</h3>
            <p className="text-[11px] text-slate-400">
              {TYPE_LABEL[card.type] ?? card.type} · {FACTION_LABEL[card.faction] ?? card.faction}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar detalle"
            className="h-7 w-7 shrink-0 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {imageUrl ? (
          <div className="relative mx-auto mb-3 aspect-[3/4] w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <Image src={imageUrl} alt={card.name} fill sizes="192px" className="object-cover" />
          </div>
        ) : null}

        <div className="mb-3 grid grid-cols-3 gap-2">
          <StatChip label="Coste" value={card.cost} />
          <StatChip label="Ataque" value={card.attack ?? "—"} />
          <StatChip label="Defensa" value={card.defense ?? "—"} />
        </div>

        {card.description ? <p className="mb-2 text-xs leading-relaxed text-slate-300">{card.description}</p> : null}
        {card.archetype ? <p className="text-[11px] text-slate-500">Arquetipo: {card.archetype}</p> : null}
        {card.effect ? <p className="text-[11px] text-slate-500">Efecto: {card.effect.action}</p> : null}

        <p className="mt-3 border-t border-slate-700 pt-2 text-[11px] font-mono text-fuchsia-300">
          Veces en el periodo: {usageCount.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
