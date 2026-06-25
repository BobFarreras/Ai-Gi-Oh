// src/components/admin/internal/AdminPromotionRow.tsx - Fila editable de una novedad en el panel admin de live-ops (tipo, imagen, texto y CTA).
"use client";

import { useState } from "react";
import { IAdminPromotionConfig } from "@/core/entities/progression/ILiveOpsAdmin";
import { PromotionKind } from "@/core/entities/progression/IPromotion";
import { getPromotionMeta } from "@/components/hub/progression/internal/promotion-meta";
import { LiveOpsField, LiveOpsToggle, LiveOpsSaveBar } from "./live-ops/live-ops-controls";
import { saveLiveOps } from "./live-ops/save-live-ops";

const KINDS: PromotionKind[] = ["EVENT", "CARD", "STORY", "PACK", "NEWS", "SYSTEM", "MAINTENANCE"];

export function AdminPromotionRow({ promotion }: { promotion: IAdminPromotionConfig }) {
  const [draft, setDraft] = useState<IAdminPromotionConfig>(promotion);
  function update<K extends keyof IAdminPromotionConfig>(key: K, value: IAdminPromotionConfig[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="border border-cyan-900/50 bg-[#03101c]/80 p-4" style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}>
      <div className="mb-3 flex items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">Tipo</span>
          <select className="border border-cyan-900/60 bg-[#03101c] px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-400" value={draft.kind} onChange={(event) => update("kind", event.target.value as PromotionKind)}>
            {KINDS.map((kind) => <option key={kind} value={kind}>{getPromotionMeta(kind).label}</option>)}
          </select>
        </label>
        <span className="ml-auto font-mono text-[10px] text-slate-600">{draft.id}</span>
      </div>
      <div className="space-y-3">
        <LiveOpsField label="Título" value={draft.title} onChange={(value) => update("title", value)} />
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">Cuerpo</span>
          <textarea
            rows={2}
            className="w-full border border-cyan-900/60 bg-[#03101c] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
            value={draft.body ?? ""}
            onChange={(event) => update("body", event.target.value)}
          />
        </label>
        <LiveOpsField label="Imagen (URL)" value={draft.mediaUrl ?? ""} onChange={(value) => update("mediaUrl", value)} placeholder="/assets/bgs/bg-tech.webp" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LiveOpsField label="Texto del botón" value={draft.ctaLabel ?? ""} onChange={(value) => update("ctaLabel", value)} placeholder="Ir al Mercado" />
          <LiveOpsField label="Enlace" value={draft.ctaHref ?? ""} onChange={(value) => update("ctaHref", value)} placeholder="/hub/market" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <LiveOpsToggle label="Novedad" checked={draft.isActive} onChange={(value) => update("isActive", value)} />
        <LiveOpsSaveBar onSave={() => saveLiveOps("promotion", draft)} />
      </div>
    </div>
  );
}
