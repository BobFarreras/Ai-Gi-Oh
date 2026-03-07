// src/components/hub/market/vault/build-market-vault-collection-view.ts - Filtra y ordena la colección del almacén Market según búsqueda y filtros activos.
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";

interface BuildMarketVaultCollectionViewInput {
  collection: ICollectionCard[];
  nameQuery: string;
  typeFilter: MarketTypeFilter;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
}

export function buildMarketVaultCollectionView(input: BuildMarketVaultCollectionViewInput): ICollectionCard[] {
  const byType =
    input.typeFilter === "ALL"
      ? [...input.collection]
      : input.collection.filter((entry) => entry.card.type === input.typeFilter);
  const normalizedQuery = input.nameQuery.trim().toLowerCase();
  const filtered =
    normalizedQuery.length === 0
      ? byType
      : byType.filter((entry) => entry.card.name.toLowerCase().includes(normalizedQuery));
  const orderFactor = input.orderDirection === "ASC" ? 1 : -1;

  filtered.sort((left, right) => {
    const leftValue =
      input.orderField === "NAME"
        ? left.card.name.localeCompare(right.card.name)
        : input.orderField === "ATTACK"
          ? (left.card.attack ?? 0) - (right.card.attack ?? 0)
          : input.orderField === "DEFENSE"
            ? (left.card.defense ?? 0) - (right.card.defense ?? 0)
            : input.orderField === "ENERGY"
              ? left.card.cost - right.card.cost
              : left.card.name.localeCompare(right.card.name);
    if (leftValue !== 0) return leftValue * orderFactor;
    return (right.ownedCopies - left.ownedCopies) * orderFactor;
  });

  return filtered;
}
