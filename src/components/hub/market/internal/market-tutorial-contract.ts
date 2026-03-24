// src/components/hub/market/internal/market-tutorial-contract.ts - Contratos opcionales para instrumentar Market en modo tutorial con UI real.
import { IMarketRuntimeSnapshot } from "@/services/market/market-runtime-snapshot";

export interface IMarketTutorialActions {
  onOpenMobileFilters?: () => void;
  onTypeFilterChange?: () => void;
  onOrderFieldChange?: () => void;
  onOrderDirectionToggle?: () => void;
  onBuyCard?: () => void;
  onBuyPack?: () => void;
  onOpenVaultCollection?: () => void;
  onOpenVaultHistory?: () => void;
  onSelectPack?: (packId: string) => void;
  onPackRevealOpen?: () => void;
  onPackRevealClose?: () => void;
}

export interface IMarketPurchaseActionOverrides {
  buyCard?: (playerId: string, listingId: string) => Promise<IMarketRuntimeSnapshot>;
  buyPack?: (playerId: string, packId: string) => Promise<IMarketRuntimeSnapshot & { openedCardIds: string[] }>;
}
