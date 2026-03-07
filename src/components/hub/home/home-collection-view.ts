// src/components/hub/home/home-collection-view.ts - Aplica filtros y orden del almacén para la vista de Mi Home.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";

interface BuildCollectionViewInput {
  collection: ICollectionCard[];
  nameQuery: string;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
}

export function buildHomeCollectionView(input: BuildCollectionViewInput): ICollectionCard[] {
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

  filtered.sort((entryA, entryB) => {
    if (input.orderField === "NAME") {
      return entryA.card.name.localeCompare(entryB.card.name) * orderFactor;
    }

    const valueA =
      input.orderField === "ATTACK"
        ? entryA.card.attack ?? 0
        : input.orderField === "DEFENSE"
          ? entryA.card.defense ?? 0
          : entryA.card.cost;
    const valueB =
      input.orderField === "ATTACK"
        ? entryB.card.attack ?? 0
        : input.orderField === "DEFENSE"
          ? entryB.card.defense ?? 0
          : entryB.card.cost;
    if (valueA === valueB) {
      return entryA.card.name.localeCompare(entryB.card.name) * orderFactor;
    }
    return (valueA - valueB) * orderFactor;
  });

  return filtered;
}
