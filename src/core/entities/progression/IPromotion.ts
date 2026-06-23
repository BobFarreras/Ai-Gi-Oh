// src/core/entities/progression/IPromotion.ts - Contrato de promoción/noticia destacada del hub.

export type PromotionKind = "PACK" | "CARD" | "EVENT" | "NEWS";

export interface IFeaturedPromotion {
  id: string;
  kind: PromotionKind;
  title: string;
  body: string | null;
  mediaUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}
