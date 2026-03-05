// src/components/hub/market/market-listing-view.ts - Aplica filtro y orden sobre listados de cartas del mercado.
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";

interface BuildMarketListingViewInput {
  listings: IMarketCardListing[];
  nameQuery: string;
  typeFilter: MarketTypeFilter;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
}

export function buildMarketListingView(input: BuildMarketListingViewInput): IMarketCardListing[] {
  const normalizedQuery = input.nameQuery.trim().toLowerCase();
  const filtered = input.listings.filter((listing) => {
    const matchesName = normalizedQuery.length === 0 || listing.card.name.toLowerCase().includes(normalizedQuery);
    const matchesType = input.typeFilter === "ALL" || listing.card.type === input.typeFilter;
    return matchesName && matchesType;
  });
  const factor = input.orderDirection === "ASC" ? 1 : -1;
  filtered.sort((listingA, listingB) => {
    if (input.orderField === "NAME") return listingA.card.name.localeCompare(listingB.card.name) * factor;
    const valueA =
      input.orderField === "ATTACK"
        ? listingA.card.attack ?? 0
        : input.orderField === "DEFENSE"
          ? listingA.card.defense ?? 0
          : input.orderField === "ENERGY"
            ? listingA.card.cost
            : listingA.priceNexus;
    const valueB =
      input.orderField === "ATTACK"
        ? listingB.card.attack ?? 0
        : input.orderField === "DEFENSE"
          ? listingB.card.defense ?? 0
          : input.orderField === "ENERGY"
            ? listingB.card.cost
            : listingB.priceNexus;
    return (valueA - valueB) * factor;
  });
  return filtered;
}
