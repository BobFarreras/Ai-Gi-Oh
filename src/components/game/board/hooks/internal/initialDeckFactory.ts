import { ICard } from "@/core/entities/ICard";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";

type CardMap = Record<string, ICard>;

const cardCatalog: CardMap = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS].reduce<CardMap>((acc, card) => {
  acc[card.id] = card;
  return acc;
}, {});

const PLAYER_A_DECK_IDS = [
  "entity-ollama",
  "exec-direct-damage-900",
  "trap-runtime-punish",
  "entity-python",
  "entity-react",
  "entity-postgress",
  "entity-supabase",
  "entity-huggenface",
  "entity-astro",
  "entity-deepseek",
  "entity-vscode",
  "entity-cursor",
  "entity-git",
  "entity-github",
  "exec-boost-atk-400",
  "exec-draw-1",
  "exec-llm-def-300",
  "exec-framework-atk-300",
  "exec-direct-damage-600",
  "trap-counter-intrusion",
  "exec-heal-700",
  "exec-db-def-300",
] as const;

const PLAYER_B_DECK_IDS = [
  "entity-perplexity",
  "entity-kali-linux",
  "entity-nextjs",
  "entity-claude",
  "entity-chatgpt",
  "entity-gemini",
  "entity-python",
  "entity-react",
  "entity-postgress",
  "entity-supabase",
  "entity-git",
  "entity-github",
  "exec-boost-atk-400",
  "trap-runtime-punish",
  "exec-draw-1",
  "exec-llm-def-300",
  "exec-framework-atk-300",
  "exec-direct-damage-900",
  "trap-counter-intrusion",
  "exec-direct-damage-600",
  "exec-heal-700",
  "exec-db-def-300",
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

export function createPlayerDeckA(): ICard[] {
  return toDeck(PLAYER_A_DECK_IDS);
}

export function createPlayerDeckB(): ICard[] {
  return toDeck(PLAYER_B_DECK_IDS);
}
