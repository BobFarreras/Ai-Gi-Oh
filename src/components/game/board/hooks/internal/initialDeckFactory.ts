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

export function createDefaultFusionDeck(): ICard[] {
  return FUSION_CARDS.slice(0, 2).map((card) => ({ ...card }));
}

/**
 * Cartas resultado de fusión que necesita un mazo: una por cada ejecutable FUSION_SUMMON presente. Sirve para
 * garantizar que meter `exec-fusion-X` en el mazo baste para poder fusionar (sin tener que configurar aparte el
 * bloque de fusión). Antes, execs sin su resultado en el fusionDeck eran cartas muertas (no fusionaban jamás).
 */
export function fusionResultsForDeck(deck: readonly ICard[]): ICard[] {
  const recipeIds = new Set<string>();
  for (const card of deck) {
    if (card.type === "EXECUTION" && card.effect?.action === "FUSION_SUMMON" && card.effect.recipeId) {
      recipeIds.add(card.effect.recipeId);
    }
  }
  return [...recipeIds].flatMap((recipeId) => {
    const fusion = cardCatalog[recipeId];
    return fusion && fusion.type === "FUSION" ? [{ ...fusion }] : [];
  });
}

/** Une un bloque de fusión con los resultados que faltan para los execs del mazo (sin duplicar por id). */
export function withDerivedFusionResults(deck: readonly ICard[], fusionDeck: readonly ICard[]): ICard[] {
  const present = new Set(fusionDeck.map((card) => card.id));
  const missing = fusionResultsForDeck(deck).filter((card) => !present.has(card.id));
  return [...fusionDeck.map((card) => ({ ...card })), ...missing];
}
