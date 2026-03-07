// src/components/game/board/hooks/internal/initialDeckFactory.ts - Construye y baraja mazos mock del tablero con fuente aleatoria inyectable.
import { ICard } from "@/core/entities/ICard";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { RandomSource } from "@/core/services/random/seeded-rng";

type CardMap = Record<string, ICard>;

const cardCatalog: CardMap = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS].reduce<CardMap>((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {});

const PLAYER_A_DECK_IDS = [
  "entity-chatgpt",
  "entity-gemini",
  "entity-claude",
  "entity-kali-linux",
  "entity-python",
  "entity-postgress",
  "entity-react",
  "entity-supabase",
  "entity-openclaw",
  "entity-github",
  "exec-fusion-gemgpt",
  "exec-fusion-kaclauli",
  "exec-fusion-pytgress",
  "exec-draw-1",
  "exec-draw-1",
  "exec-boost-atk-400",
  "exec-llm-def-300",
  "trap-kernel-panic",
  "trap-runtime-punish",
  "trap-atk-drain",
] as const;

const PLAYER_B_DECK_IDS = [
  "entity-chatgpt",
  "entity-gemini",
  "entity-claude",
  "entity-kali-linux",
  "entity-python",
  "entity-postgress",
  "entity-ollama",
  "entity-deepseek",
  "entity-astro",
  "entity-vercel",
  "entity-git",
  "exec-fusion-gemgpt",
  "exec-fusion-kaclauli",
  "exec-fusion-pytgress",
  "exec-draw-1",
  "exec-draw-1",
  "exec-direct-damage-600",
  "exec-heal-700",
  "trap-counter-intrusion",
  "trap-def-fragment",
] as const;

function toDeck(deckIds: readonly string[]): ICard[] {
  return deckIds.map((id) => {
    const card = cardCatalog[id];
    if (!card) {
      throw new Error(`Carta no encontrada en catálogo: ${id}`);
    }
    return { ...card };
  });
}

export function shuffleDeck(deck: ICard[], randomFn: RandomSource = Math.random): ICard[] {
  const shuffled = [...deck];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomFn() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

export function createPlayerDeckA(randomFn: RandomSource = Math.random): ICard[] {
  return shuffleDeck(toDeck(PLAYER_A_DECK_IDS), randomFn);
}

export function createPlayerDeckB(randomFn: RandomSource = Math.random): ICard[] {
  return shuffleDeck(toDeck(PLAYER_B_DECK_IDS), randomFn);
}
