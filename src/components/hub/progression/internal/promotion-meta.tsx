// src/components/hub/progression/internal/promotion-meta.tsx - Metadata visual (etiqueta, color, icono) por tipo de novedad para el formato revista.
import { ReactNode } from "react";
import { PromotionKind } from "@/core/entities/progression/IPromotion";

export interface IPromotionMeta {
  label: string;
  /** Clases de texto + borde del acento de la categoría. */
  accent: string;
  /** Gradiente de fondo para el placeholder cuando no hay imagen. */
  placeholder: string;
  icon: ReactNode;
}

const ICON_CLASS = "h-full w-full fill-none stroke-current";

const STAR = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinejoin="round"><path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" /></svg>;
const BAG = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
const CARDS = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="5" width="13" height="16" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v13" /></svg>;
const BOOK = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h12" /></svg>;
const ALERT = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>;
const WRENCH = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 7a4 4 0 0 1-5 5l-5 5 3 3 5-5a4 4 0 0 0 5-5l-2 2-2-1-1-2 2-2z" /></svg>;
const MEGAPHONE = <svg viewBox="0 0 24 24" className={ICON_CLASS} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" /><path d="M15 8a5 5 0 0 1 0 8" /></svg>;

const META: Record<PromotionKind, IPromotionMeta> = {
  EVENT: { label: "Evento", accent: "text-fuchsia-300 border-fuchsia-600/50", placeholder: "from-fuchsia-900/40 to-fuchsia-950/30", icon: STAR },
  PACK: { label: "Tienda", accent: "text-amber-300 border-amber-600/50", placeholder: "from-amber-900/40 to-amber-950/30", icon: BAG },
  CARD: { label: "Nuevas cartas", accent: "text-cyan-300 border-cyan-600/50", placeholder: "from-cyan-900/40 to-cyan-950/30", icon: CARDS },
  STORY: { label: "Historia", accent: "text-violet-300 border-violet-600/50", placeholder: "from-violet-900/40 to-violet-950/30", icon: BOOK },
  SYSTEM: { label: "Aviso de sistema", accent: "text-rose-300 border-rose-600/50", placeholder: "from-rose-900/40 to-rose-950/30", icon: ALERT },
  MAINTENANCE: { label: "Mantenimiento", accent: "text-amber-300 border-amber-600/50", placeholder: "from-amber-900/40 to-slate-900/40", icon: WRENCH },
  NEWS: { label: "Novedad", accent: "text-emerald-300 border-emerald-600/50", placeholder: "from-emerald-900/40 to-emerald-950/30", icon: MEGAPHONE },
};

export function getPromotionMeta(kind: PromotionKind): IPromotionMeta {
  return META[kind] ?? META.NEWS;
}
