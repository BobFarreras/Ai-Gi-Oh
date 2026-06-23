// src/components/hub/progression/NewsPanel.tsx - Panel de noticias/promociones destacadas con CTA de navegación.
"use client";

import Link from "next/link";
import Image from "next/image";
import { IFeaturedPromotion, PromotionKind } from "@/core/entities/progression/IPromotion";

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

export function NewsPanel({ promotions, onClose }: { promotions: IFeaturedPromotion[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Novedades" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border border-cyan-800/60 bg-slate-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest text-cyan-100">Novedades</h2>
          <button type="button" aria-label="Cerrar" className="h-7 w-7 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800" onClick={onClose}>✕</button>
        </div>

        {promotions.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">No hay novedades por ahora.</p>
        ) : (
          promotions.map((promo) => (
            <article key={promo.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50">
              {promo.mediaUrl ? (
                <div className="relative h-28 w-full bg-slate-900">
                  <Image src={promo.mediaUrl} alt={promo.title} fill sizes="420px" className="object-cover" />
                </div>
              ) : null}
              <div className="space-y-2 p-3">
                <span className={`inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${KIND_ACCENT[promo.kind]}`}>
                  {KIND_LABEL[promo.kind]}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{promo.title}</h3>
                {promo.body ? <p className="text-xs leading-relaxed text-slate-300">{promo.body}</p> : null}
                {promo.ctaHref && promo.ctaLabel ? (
                  <Link
                    href={promo.ctaHref}
                    onClick={onClose}
                    className="inline-flex h-8 items-center rounded-lg bg-cyan-500 px-3 text-[11px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400"
                  >
                    {promo.ctaLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
