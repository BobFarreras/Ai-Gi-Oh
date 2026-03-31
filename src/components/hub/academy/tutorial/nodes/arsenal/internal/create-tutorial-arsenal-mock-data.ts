// src/components/hub/academy/tutorial/nodes/arsenal/internal/create-tutorial-arsenal-mock-data.ts - Genera estado mock seguro para el nodo Preparar Deck sin tocar persistencia real.
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

interface ITutorialArsenalMockData {
  deck: IDeck;
  collection: ICollectionCard[];
  cardProgress: IPlayerCardProgress[];
}

function buildCard(
  id: string,
  name: string,
  type: ICard["type"],
  cost: number,
  renderUrl: string,
  description: string,
  attack = 1200,
  defense = 1200,
): ICard {
  return {
    id,
    name,
    description,
    type,
    faction: "OPEN_SOURCE",
    cost,
    attack,
    defense,
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl,
  };
}

/**
 * Crea un sandbox estático de tutorial para enseñar acciones sin mutar el inventario real del jugador.
 */
export function createTutorialArsenalMockData(playerId: string): ITutorialArsenalMockData {
  const cards = new Map<string, ICard>([
    ["tutorial-chatgpt", buildCard("tutorial-chatgpt", "ChatGPT", "ENTITY", 3, "/assets/renders/chatgpt.webp", "Material de fusión 1. Debe combinarse con Gemini para habilitar GemGPT.", 1600, 1300)],
    ["tutorial-gemini", buildCard("tutorial-gemini", "Gemini", "ENTITY", 3, "/assets/renders/gemini.webp", "Material de fusión 2. Junto con ChatGPT y la mágica adecuada activa la fusión GemGPT.", 1550, 1400)],
    ["tutorial-gemgpt-magic", buildCard("tutorial-gemgpt-magic", "Kernel de GemGPT", "EXECUTION", 4, "/assets/renders/docker.webp", "Mágica de fusión específica: combina ChatGPT + Gemini para invocar GemGPT.")],
    ["tutorial-gemgpt-fusion", { ...buildCard("tutorial-gemgpt-fusion", "GemGPT", "FUSION", 7, "/assets/renders/gemgpt.webp", "Carta de fusión final. Solo puede estar en Bloque de Fusión. Requiere ChatGPT + Gemini + Kernel de GemGPT.", 3000, 2500), fusionMaterials: ["tutorial-chatgpt", "tutorial-gemini"] }],
    ["mock-evolve-spark", buildCard("mock-evolve-spark", "Spark Adapter", "ENTITY", 2, "/assets/renders/vscode.webp", "Carta tutorial de evolución. Cuando vibra en almacén tienes copias suficientes para subir de versión.", 1100, 1300)],
    ["mock-filler-1", buildCard("mock-filler-1", "CLI Scout", "ENTITY", 1, "/assets/renders/linux.webp", "Carta de soporte para completar el deck de práctica a 20 cartas.", 900, 900)],
    ["mock-filler-2", buildCard("mock-filler-2", "Type Checker", "ENTITY", 2, "/assets/renders/python.webp", "Carta de soporte de práctica para explicar orden y filtros del almacén.", 1400, 1000)],
    ["mock-filler-3", buildCard("mock-filler-3", "Event Bus", "ENTITY", 2, "/assets/renders/supabase.webp", "Carta de soporte para mantener el cupo reglamentario del deck.", 1000, 1500)],
    ["mock-filler-4", buildCard("mock-filler-4", "Cache Layer", "TRAP", 2, "/assets/renders/cloudflare.webp", "Trampa de práctica para enseñar tipos distintos dentro del mismo mazo.", 0, 0)],
  ]);
  const tutorialDeckOrder = [
    "tutorial-chatgpt",
    "tutorial-gemini",
    "tutorial-gemgpt-magic",
    "mock-filler-1",
    "mock-filler-2",
    "mock-filler-3",
    "mock-filler-4",
    "mock-filler-1",
    "mock-filler-2",
    "mock-filler-3",
    "mock-filler-4",
    "mock-filler-1",
    "mock-filler-2",
    "mock-filler-3",
    "mock-filler-4",
    "mock-filler-1",
    "mock-filler-2",
    "mock-filler-3",
    "mock-filler-4",
    "mock-filler-1",
  ];
  const deckSlots = tutorialDeckOrder.map((cardId, index) => ({ index, cardId }));
  const collection: ICollectionCard[] = Array.from(cards.values()).map((card) => ({
    card,
    ownedCopies: card.id === "mock-evolve-spark" ? 20 : card.id === "tutorial-gemgpt-fusion" ? 1 : 6,
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
  return {
    deck: { playerId, slots: deckSlots, fusionSlots: [{ index: 0, cardId: "tutorial-gemgpt-fusion" }, { index: 1, cardId: null }] },
    collection,
    cardProgress,
  };
}
