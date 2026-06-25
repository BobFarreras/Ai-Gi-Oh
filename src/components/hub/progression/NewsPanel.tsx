// src/components/hub/progression/NewsPanel.tsx - Diálogo de novedades en formato revista: presentador (BigLog), artículo destacado, lista temática con imágenes y categorías.
"use client";

import Link from "next/link";
import Image from "next/image";
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";
import { ProgressionDialogShell } from "./internal/ProgressionDialogShell";
import { getPromotionMeta } from "./internal/promotion-meta";

const HOST_AVATAR = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp";
const ARTICLE_CLIP = "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)";

function CategoryBadge({ kind, size = "sm" }: { kind: IFeaturedPromotion["kind"]; size?: "sm" | "xs" }) {
  const meta = getPromotionMeta(kind);
  return (
    <span className={`inline-flex items-center gap-1.5 border bg-black/40 px-2 py-0.5 font-display uppercase tracking-[0.14em] ${meta.accent} ${size === "xs" ? "text-[9px]" : "text-[10px]"}`}>
      <span className="h-3 w-3">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

function ArticleMedia({ promo, className }: { promo: IFeaturedPromotion; className: string }) {
  const meta = getPromotionMeta(promo.kind);
  if (promo.mediaUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={promo.mediaUrl} alt={promo.title} fill sizes="600px" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${meta.placeholder} ${className}`}>
      <span className={`h-10 w-10 opacity-80 ${meta.accent}`}>{meta.icon}</span>
    </div>
  );
}

function CtaLink({ promo, onClose }: { promo: IFeaturedPromotion; onClose: () => void }) {
  if (!promo.ctaHref || !promo.ctaLabel) return null;
  return (
    <Link
      href={promo.ctaHref}
      onClick={onClose}
      className="mt-2 inline-flex h-8 items-center bg-cyan-500 px-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-400"
      style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
    >
      {promo.ctaLabel}
    </Link>
  );
}

export function NewsPanel({ promotions, eventName, onClose }: { promotions: IFeaturedPromotion[]; eventName?: string | null; onClose: () => void }) {
  const [hero, ...rest] = promotions;
  const intro = eventName
    ? `Estamos en plena temporada de "${eventName}". Aquí tienes lo último.`
    : "Bienvenido al canal de novedades. Esto es lo último del sistema.";

  return (
    <ProgressionDialogShell title="Novedades" subtitle="El boletín de AI-GI-OH" maxWidthClass="max-w-2xl" onClose={onClose}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      }
    >
      {promotions.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No hay novedades por ahora.</p>
      ) : (
        <>
          {/* Presentador */}
          <div className="mb-4 flex items-center gap-3 border border-cyan-900/50 bg-[#03101c]/70 p-3" style={{ clipPath: ARTICLE_CLIP }}>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-cyan-500/50 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
              <Image src={HOST_AVATAR} alt="BigLog" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-cyan-200">BigLog</p>
              <p className="text-sm leading-snug text-slate-300">{intro}</p>
            </div>
          </div>

          {/* Artículo destacado */}
          {hero ? (
            <article className="mb-4 overflow-hidden border border-cyan-800/50 bg-[#03101c]/80" style={{ clipPath: ARTICLE_CLIP }}>
              <ArticleMedia promo={hero} className="h-44 w-full" />
              <div className="p-4">
                <CategoryBadge kind={hero.kind} />
                <h3 className="mt-2 font-display text-xl font-bold text-slate-50">{hero.title}</h3>
                {hero.body ? <p className="mt-2 font-display text-base leading-relaxed text-slate-200">{hero.body}</p> : null}
                <CtaLink promo={hero} onClose={onClose} />
              </div>
            </article>
          ) : null}

          {/* Resto de artículos */}
          {rest.length > 0 ? (
            <div className="space-y-2.5">
              {rest.map((promo) => (
                <article key={promo.id} className="flex gap-3 border border-cyan-900/50 bg-[#03101c]/70 p-2.5" style={{ clipPath: ARTICLE_CLIP }}>
                  <ArticleMedia promo={promo} className="h-20 w-20 shrink-0 rounded-md" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <CategoryBadge kind={promo.kind} size="xs" />
                    <h4 className="mt-1 truncate font-display text-base font-bold text-slate-100">{promo.title}</h4>
                    {promo.body ? <p className="line-clamp-2 font-display text-sm leading-relaxed text-slate-300">{promo.body}</p> : null}
                    <CtaLink promo={promo} onClose={onClose} />
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}
    </ProgressionDialogShell>
  );
}
