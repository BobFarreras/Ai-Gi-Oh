// src/components/hub/home/home-collection-view.ts - Aplica filtros y orden del almacén para la vista de Mi Home.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";

interface BuildCollectionViewInput {
  collection: ICollectionCard[];
  nameQuery: string;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  /**
   * Progreso por jugador (nivel/versión). El nivel y la versión NO viven en `card` (que es la carta
   * base del catálogo), sino en este mapa; por eso el orden por LEVEL/VERSION lo consulta aquí.
   */
  cardProgressById?: Map<string, IPlayerCardProgress>;
}

/** Nivel efectivo del jugador para la carta (progreso por jugador; base como fallback determinista). */
function resolveCardLevel(entry: ICollectionCard, cardProgressById?: Map<string, IPlayerCardProgress>): number {
  return cardProgressById?.get(entry.card.id)?.level ?? entry.card.level ?? 0;
}

/** Versión efectiva del jugador para la carta (progreso por jugador; base como fallback determinista). */
function resolveCardVersion(entry: ICollectionCard, cardProgressById?: Map<string, IPlayerCardProgress>): number {
  return cardProgressById?.get(entry.card.id)?.versionTier ?? entry.card.versionTier ?? 0;
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

    const resolveValue = (entry: ICollectionCard): number => {
      switch (input.orderField) {
        case "ATTACK":
          return entry.card.attack ?? 0;
        case "DEFENSE":
          return entry.card.defense ?? 0;
        case "LEVEL":
          return resolveCardLevel(entry, input.cardProgressById);
        case "VERSION":
          return resolveCardVersion(entry, input.cardProgressById);
        default:
          return entry.card.cost;
      }
    };
    const valueA = resolveValue(entryA);
    const valueB = resolveValue(entryB);
    if (valueA === valueB) {
      return entryA.card.name.localeCompare(entryB.card.name) * orderFactor;
    }
    return (valueA - valueB) * orderFactor;
  });

  return filtered;
}
