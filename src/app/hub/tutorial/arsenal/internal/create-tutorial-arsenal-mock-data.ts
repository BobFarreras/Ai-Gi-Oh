// src/app/hub/tutorial/arsenal/internal/create-tutorial-arsenal-mock-data.ts - Genera estado mock seguro para el nodo Preparar Deck sin tocar persistencia real.
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

interface ITutorialArsenalMockData {
  deck: IDeck;
  collection: ICollectionCard[];
  cardProgress: IPlayerCardProgress[];
}

function buildCard(id: string, name: string, type: ICard["type"], cost: number, attack = 1200, defense = 1200): ICard {
  return { id, name, description: `Carta de práctica: ${name}.`, type, faction: "OPEN_SOURCE", cost, attack, defense };
}

/**
 * Crea un sandbox estático de tutorial para enseñar acciones sin mutar el inventario real del jugador.
 */
export function createTutorialArsenalMockData(playerId: string): ITutorialArsenalMockData {
  const cards = new Map<string, ICard>([
    ["mock-material-a", buildCard("mock-material-a", "Kernel Fragment A", "ENTITY", 2, 1300, 1100)],
    ["mock-material-b", buildCard("mock-material-b", "Kernel Fragment B", "ENTITY", 2, 1250, 1200)],
    ["mock-fusion-magic", buildCard("mock-fusion-magic", "Compilador de Fusión", "EXECUTION", 3)],
    ["mock-fusion-core", { ...buildCard("mock-fusion-core", "Arquitecto Híbrido", "FUSION", 5, 2400, 2100), fusionMaterials: ["mock-material-a", "mock-material-b"] }],
    ["mock-evolve-spark", buildCard("mock-evolve-spark", "Spark Adapter", "ENTITY", 2, 1100, 1300)],
    ["mock-filler-1", buildCard("mock-filler-1", "CLI Scout", "ENTITY", 1, 900, 900)],
    ["mock-filler-2", buildCard("mock-filler-2", "Type Checker", "ENTITY", 2, 1400, 1000)],
    ["mock-filler-3", buildCard("mock-filler-3", "Event Bus", "ENTITY", 2, 1000, 1500)],
    ["mock-filler-4", buildCard("mock-filler-4", "Cache Layer", "TRAP", 2, 0, 0)],
  ]);
  const deckPattern = ["mock-material-a", "mock-material-b", "mock-fusion-magic", "mock-filler-1", "mock-filler-2", "mock-filler-3", "mock-filler-4"];
  const deckSlots = Array.from({ length: 20 }, (_, index) => ({ index, cardId: deckPattern[index % deckPattern.length] ?? "mock-filler-1" }));
  const collection: ICollectionCard[] = Array.from(cards.values()).map((card) => ({
    card,
    ownedCopies: card.id === "mock-evolve-spark" ? 10 : 6,
  }));
  const cardProgress: IPlayerCardProgress[] = [
    {
      playerId,
      cardId: "mock-evolve-spark",
      versionTier: 1,
      level: 3,
      xp: 140,
      masteryPassiveSkillId: null,
      updatedAtIso: new Date().toISOString(),
    },
  ];
  return { deck: { playerId, slots: deckSlots, fusionSlots: [{ index: 0, cardId: "mock-fusion-core" }, { index: 1, cardId: null }] }, collection, cardProgress };
}
