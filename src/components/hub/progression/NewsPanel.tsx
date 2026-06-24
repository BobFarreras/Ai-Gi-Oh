// src/components/hub/progression/NewsPanel.tsx - Diálogo táctico de noticias/promociones destacadas con CTA de navegación.
"use client";

import Link from "next/link";
import Image from "next/image";
import { IFeaturedPromotion, PromotionKind } from "@/core/entities/progression/IPromotion";
import { ProgressionDialogShell } from "./internal/ProgressionDialogShell";

const KIND_LABEL: Record<PromotionKind, string> = {
  PACK: "Tienda",
  CARD: "Carta",
  EVENT: "Evento",
  NEWS: "Novedad",
};

const KIND_ACCENT: Record<PromotionKind, string> = {
  PACK: "text-amber-300 border-amber-600/50",
  CARD: "text-cyan-300 border-cyan-600/50",
  EVENT: "text-fuchsia-300 border-fuchsia-600/50",
  NEWS: "text-emerald-300 border-emerald-600/50",
};

const ITEM_CLIP = "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)";

export function NewsPanel({ promotions, onClose }: { promotions: IFeaturedPromotion[]; onClose: () => void }) {
  return (
    <ProgressionDialogShell
      title="Novedades"
      subtitle="Eventos y promociones activas"
      onClose={onClose}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      }
    >
      {promotions.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">No hay novedades por ahora.</p>
      ) : (
        <div className="space-y-2.5">
          {promotions.map((promo) => (
            <article key={promo.id} className="overflow-hidden border border-cyan-900/50 bg-[#03101c]/80" style={{ clipPath: ITEM_CLIP }}>
              {promo.mediaUrl ? (
                <div className="relative h-28 w-full bg-slate-900">
                  <Image src={promo.mediaUrl} alt={promo.title} fill sizes="420px" className="object-cover" />
                </div>
              ) : null}
              <div className="space-y-2 p-3">
                <span className={`inline-block border px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] ${KIND_ACCENT[promo.kind]}`}>
                  {KIND_LABEL[promo.kind]}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{promo.title}</h3>
                {promo.body ? <p className="text-xs leading-relaxed text-slate-400">{promo.body}</p> : null}
                {promo.ctaHref && promo.ctaLabel ? (
                  <Link
                    href={promo.ctaHref}
                    onClick={onClose}
                    className="inline-flex h-8 items-center bg-cyan-500 px-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-400"
                    style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
                  >
                    {promo.ctaLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </ProgressionDialogShell>
  );
}
