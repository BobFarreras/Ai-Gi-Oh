// src/components/hub/home/home-collection-view.ts - Aplica filtros y orden del almacén para la vista de Mi Home.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

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
  /** Bonus de objetos de mejora (ATK/DEF) por carta, para que la rejilla muestre las stats reales. */
  cardUpgradesById?: Map<string, ICardUpgradeBonuses>;
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
  // Hidrata cada carta con la progresión del jugador (nivel/versión) para que la rejilla muestre los
  // ATRIBUTOS reales (ATK/DEF/coste subidos por nivel), no los del catálogo base. Sin progreso, la
  // hidratación es neutra (nivel 0 → sin bonus), así que las cartas sin subir quedan igual.
  const hydrated = input.collection.map((entry) => ({
    ...entry,
    card: applyCardProgressionToCard(entry.card, input.cardProgressById?.get(entry.card.id) ?? null, input.cardUpgradesById?.get(entry.card.id)),
  }));
  const byType =
    input.typeFilter === "ALL"
      ? [...hydrated]
      : hydrated.filter((entry) => entry.card.type === input.typeFilter);
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
