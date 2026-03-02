import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

const mockHandA: ICard[] = [
  {
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
  },
  {
    id: "card-spell-ddos",
    name: "DDoS Attack",
    type: "EXECUTION",
    faction: "NO_CODE",
    cost: 2,
    description: "Drena 1000 LP al rival.",
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/n8n.png",
    effect: { action: "DAMAGE", target: "OPPONENT", value: 1000 },
  },
];

const mockHandB: ICard[] = [
  {
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
  },
];

const mockOpponentEntityStrong: IBoardEntity = {
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
};

const mockOpponentEntityWeak: IBoardEntity = {
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
};

const generateDeck = (prefix: string): string[] => Array.from({ length: 17 }).map((_, index) => `${prefix}-deck-${index}`);

export const initialGameState: GameState = {
  playerA: {
    id: "p1",
    name: "Neo (Tú)",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: generateDeck("p1"),
    hand: mockHandA,
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
  },
  playerB: {
    id: "p2",
    name: "Agente Smith",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: generateDeck("p2"),
    hand: mockHandB,
    graveyard: [],
    activeEntities: [mockOpponentEntityStrong, mockOpponentEntityWeak],
    activeExecutions: [],
  },
  activePlayerId: "p1",
  turn: 1,
  phase: "MAIN_1",
  hasNormalSummonedThisTurn: false,
};
