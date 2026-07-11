// src/components/hub/home/home-collection-view.test.ts - Valida filtrado por nombre y ordenado base de la colección del Arsenal.
import { describe, expect, it } from "vitest";
import { buildHomeCollectionView } from "@/components/hub/home/home-collection-view";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

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

  it("ordena por NIVEL usando el progreso por jugador (no la carta base)", () => {
    const cardProgressById = new Map<string, IPlayerCardProgress>([
      ["entity-python", { playerId: "p", cardId: "entity-python", versionTier: 1, level: 20, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "1970-01-01T00:00:00.000Z" }],
      ["entity-rust", { playerId: "p", cardId: "entity-rust", versionTier: 3, level: 5, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "1970-01-01T00:00:00.000Z" }],
    ]);
    const result = buildHomeCollectionView({
      collection: COLLECTION,
      nameQuery: "",
      typeFilter: "ENTITY",
      orderField: "LEVEL",
      orderDirection: "DESC",
      cardProgressById,
    });
    expect(result.map((entry) => entry.card.id)).toEqual(["entity-python", "entity-rust"]);
  });

  it("ordena por VERSIÓN usando el progreso por jugador", () => {
    const cardProgressById = new Map<string, IPlayerCardProgress>([
      ["entity-python", { playerId: "p", cardId: "entity-python", versionTier: 1, level: 20, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "1970-01-01T00:00:00.000Z" }],
      ["entity-rust", { playerId: "p", cardId: "entity-rust", versionTier: 3, level: 5, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "1970-01-01T00:00:00.000Z" }],
    ]);
    const result = buildHomeCollectionView({
      collection: COLLECTION,
      nameQuery: "",
      typeFilter: "ENTITY",
      orderField: "VERSION",
      orderDirection: "DESC",
      cardProgressById,
    });
    expect(result.map((entry) => entry.card.id)).toEqual(["entity-rust", "entity-python"]);
  });
});
