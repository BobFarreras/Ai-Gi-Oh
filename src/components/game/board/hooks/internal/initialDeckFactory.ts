import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";

const cardP1Gemini: ICard = {
  id: "card-p1-gemini",
  name: "Gemini 1.5",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  attack: 2500,
  defense: 2000,
  description: "LLM Multimodal.",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/gemini.png",
};

const cardSpellDdos: ICard = {
  id: "card-spell-ddos",
  name: "DDoS Attack",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  description: "Drena 1000 LP al rival.",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/n8n.png",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 1000 },
};

const cardP1Lite: ICard = {
  id: "card-p1-lite",
  name: "Mini Agent",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 1,
  attack: 1200,
  defense: 900,
  description: "Entidad ágil de apertura.",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/openclaw.png",
};

const cardP2Llama: ICard = {
  id: "op2",
  name: "Llama 3",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 3,
  attack: 2200,
  defense: 2000,
  description: "Open weights.",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/make.png",
};

const cardP2Shield: ICard = {
  id: "op-shield",
  name: "Firewall Mesh",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 2,
  attack: 1400,
  defense: 1800,
  description: "Malla defensiva adaptable.",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/chatgpt.png",
};

const cardP2Pulse: ICard = {
  id: "op-pulse",
  name: "Pulse Script",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  description: "Descarga directa de red.",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/n8n.png",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 500 },
};

function createFillerDeck(prefix: string, count: number): ICard[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${prefix}-deck-${index}`,
    name: `Bot ${prefix.toUpperCase()} ${index + 1}`,
    type: index % 4 === 0 ? "EXECUTION" : "ENTITY",
    faction: index % 2 === 0 ? "BIG_TECH" : "OPEN_SOURCE",
    cost: 1 + (index % 4),
    attack: 1100 + index * 30,
    defense: 900 + index * 25,
    description: "Carta de mazo base temporal.",
    effect: index % 4 === 0 ? { action: "DAMAGE", target: "OPPONENT", value: 300 } : undefined,
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/openclaw.png",
  }));
}

export function createPlayerDeckA(): ICard[] {
  return [cardP1Gemini, cardSpellDdos, cardP1Lite, ...createFillerDeck("p1", 17)];
}

export function createPlayerDeckB(): ICard[] {
  return [cardP2Llama, cardP2Shield, cardP2Pulse, ...createFillerDeck("p2", 17)];
}

export function createOpponentInitialEntities(): IBoardEntity[] {
  return [
    {
      instanceId: "inst-gpt4-boss-001",
      card: {
        id: "op1",
        name: "GPT-4",
        type: "ENTITY",
        faction: "BIG_TECH",
        cost: 4,
        attack: 3000,
        defense: 2500,
        description: "Top tier LLM.",
        bgUrl: "/assets/bgs/bg-tech.jpg",
        renderUrl: "/assets/renders/chatgpt.png",
      },
      mode: "ATTACK",
      hasAttackedThisTurn: false,
      isNewlySummoned: false,
    },
    {
      instanceId: "inst-weak-bug-002",
      card: {
        id: "op-weak",
        name: "OpenClaw",
        type: "ENTITY",
        faction: "OPEN_SOURCE",
        cost: 1,
        attack: 1000,
        defense: 500,
        description: "Fácil de aplastar.",
        bgUrl: "/assets/bgs/bg-tech.jpg",
        renderUrl: "/assets/renders/openclaw.png",
      },
      mode: "DEFENSE",
      hasAttackedThisTurn: false,
      isNewlySummoned: false,
    },
  ];
}

