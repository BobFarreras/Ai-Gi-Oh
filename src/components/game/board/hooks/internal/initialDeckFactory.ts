import { ICard } from "@/core/entities/ICard";

function getEntityStatsByCost(cost: number): Pick<ICard, "attack" | "defense"> {
  if (cost <= 1) {
    return { attack: 500, defense: 900 };
  }

  if (cost === 2) {
    return { attack: 800, defense: 1000 };
  }

  if (cost === 3) {
    return { attack: 1150, defense: 1050 };
  }

  if (cost === 4) {
    return { attack: 1500, defense: 1100 };
  }

  if (cost === 5) {
    return { attack: 1850, defense: 1200 };
  }

  if (cost === 6) {
    return { attack: 2200, defense: 1400 };
  }

  return { attack: 2600, defense: 1600 };
}

function withScaledEntityStats(card: ICard): ICard {
  if (card.type !== "ENTITY") {
    return card;
  }

  return { ...card, ...getEntityStatsByCost(card.cost) };
}

function withDamageDescription(card: ICard): ICard {
  if (card.type !== "EXECUTION" || card.effect?.action !== "DAMAGE") {
    return card;
  }

  return { ...card, description: `${card.description} (Daño: ${card.effect.value})` };
}

const cardP1Gemini: ICard = {
  id: "card-p1-gemini",
  name: "Gemini 1.5",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  ...getEntityStatsByCost(3),
  description: "LLM Multimodal.",
  archetype: "SYNTH",
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
  ...getEntityStatsByCost(1),
  description: "Entidad ágil de apertura.",
  archetype: "SYNTH",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/openclaw.png",
};

const cardP1Fusion: ICard = {
  id: "fusion-p1-overmind",
  name: "Overmind Nexus",
  type: "FUSION",
  faction: "BIG_TECH",
  cost: 6,
  attack: 2800,
  defense: 2200,
  description: "Fusión táctica de dos nodos SYNTH.",
  fusionRecipeId: "fusion-p1-overmind",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/gemini.png",
};

const cardP2Llama: ICard = {
  id: "op2",
  name: "Llama 3",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 3,
  ...getEntityStatsByCost(3),
  description: "Open weights.",
  archetype: "CORE",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/make.png",
};

const cardP2Shield: ICard = {
  id: "op-shield",
  name: "Firewall Mesh",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 2,
  ...getEntityStatsByCost(2),
  description: "Malla defensiva adaptable.",
  archetype: "CORE",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/chatgpt.png",
};

const cardP2Fusion: ICard = {
  id: "fusion-p2-overmind",
  name: "Smith Overmind",
  type: "FUSION",
  faction: "OPEN_SOURCE",
  cost: 6,
  attack: 2750,
  defense: 2300,
  description: "Fusión ofensiva de dos núcleos CORE.",
  fusionRecipeId: "fusion-p2-overmind",
  bgUrl: "/assets/bgs/bg-tech.jpg",
  renderUrl: "/assets/renders/make.png",
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
  return Array.from({ length: count }).map((_, index) => {
    const type = index % 4 === 0 ? "EXECUTION" : "ENTITY";
    const cost = 1 + (index % 4);
    const baseCard: ICard = {
      id: `${prefix}-deck-${index}`,
      name: `Bot ${prefix.toUpperCase()} ${index + 1}`,
      type,
      faction: index % 2 === 0 ? "BIG_TECH" : "OPEN_SOURCE",
      cost,
      attack: type === "ENTITY" ? getEntityStatsByCost(cost).attack : undefined,
      defense: type === "ENTITY" ? getEntityStatsByCost(cost).defense : undefined,
      description: "Carta de mazo base temporal.",
      archetype: type === "ENTITY" ? (prefix === "p1" ? "SYNTH" : "CORE") : undefined,
      effect: type === "EXECUTION" ? { action: "DAMAGE", target: "OPPONENT", value: 300 } : undefined,
      bgUrl: "/assets/bgs/bg-tech.jpg",
      renderUrl: "/assets/renders/openclaw.png",
    };
    return withDamageDescription(withScaledEntityStats(baseCard));
  });
}

export function createPlayerDeckA(): ICard[] {
  return [cardP1Gemini, withDamageDescription(cardSpellDdos), cardP1Lite, cardP1Fusion, ...createFillerDeck("p1", 16)];
}

export function createPlayerDeckB(): ICard[] {
  return [cardP2Llama, cardP2Shield, withDamageDescription(cardP2Pulse), cardP2Fusion, ...createFillerDeck("p2", 16)];
}
