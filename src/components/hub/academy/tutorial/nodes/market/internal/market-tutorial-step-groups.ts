// src/components/hub/academy/tutorial/nodes/market/internal/market-tutorial-step-groups.ts - Agrupa stepIds del nodo Market para reglas de posicionamiento y resaltado del tutorial.
export const MARKET_PINNED_TOP_STEPS = [
  "market-buy-card",
  "market-buy-card-result-warehouse",
  "market-pack-selection",
  "market-pack-preview-cards",
  "market-buy-pack",
  "market-pack-random-explanation",
] as const;

export const MARKET_FILTER_GUIDE_STEPS = [
  "market-type-filter",
  "market-order-filter",
  "market-order-direction",
] as const;

export const MARKET_NEXT_BUTTON_HIGHLIGHT_STEPS = [
  "market-mobile-section-listings",
  "market-mobile-section-packs",
  "market-mobile-section-vault",
  "market-buy-card-result-warehouse",
  "market-pack-preview-cards",
  "market-buy-pack",
  "market-pack-random-explanation",
  "market-open-vault-collection",
  "market-open-history",
] as const;
