// src/components/hub/home/home-collection-view.test.ts - Valida filtrado por nombre y ordenado base de la colección del Arsenal.
import { describe, expect, it } from "vitest";
import { buildHomeCollectionView } from "@/components/hub/home/home-collection-view";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";

const COLLECTION: ICollectionCard[] = [
  {
    card: { id: "entity-python", name: "Python", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 800, defense: 900 },
    ownedCopies: 3,
  },
  {
    card: { id: "entity-rust", name: "Rust", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 700 },
    ownedCopies: 2,
  },
  {
    card: { id: "exec-wrap", name: "Wrap", description: "", type: "EXECUTION", faction: "NEUTRAL", cost: 4 },
    ownedCopies: 1,
  },
];

describe("buildHomeCollectionView", () => {
  it("filtra por nombre ignorando mayúsculas y minúsculas", () => {
    const result = buildHomeCollectionView({
      collection: COLLECTION,
      nameQuery: "py",
      typeFilter: "ALL",
      orderField: "NAME",
      orderDirection: "ASC",
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.card.id).toBe("entity-python");
  });

  it("mantiene filtrado por tipo y nombre en conjunto", () => {
    const result = buildHomeCollectionView({
      collection: COLLECTION,
      nameQuery: "r",
      typeFilter: "ENTITY",
      orderField: "NAME",
      orderDirection: "ASC",
    });
    expect(result.map((entry) => entry.card.id)).toEqual(["entity-rust"]);
  });
});
