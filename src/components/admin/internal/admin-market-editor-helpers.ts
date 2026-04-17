// src/components/admin/internal/admin-market-editor-helpers.ts - Utilidades puras para selección inicial y preview de pool en editor de market.
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { IAdminMarketPackDraft } from "@/components/admin/internal/admin-market-drafts";

export function resolveFirstCardId(snapshot: IAdminCatalogSnapshot): string {
  return snapshot.cards[0]?.id ?? "";
}

export function resolveFirstPackId(snapshot: IAdminCatalogSnapshot): string {
  return snapshot.packs[0]?.id ?? "";
}

export function toPreviewIdsText(poolEntries: IAdminMarketPackDraft["poolEntries"]): string {
  return poolEntries.map((entry) => entry.cardId).filter((cardId) => cardId.trim().length > 0).join(",");
}
