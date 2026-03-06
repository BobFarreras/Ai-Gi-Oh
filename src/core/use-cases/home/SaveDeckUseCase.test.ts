// src/core/use-cases/home/SaveDeckUseCase.test.ts - Valida guardado solo cuando el mazo cumple tamaño y reglas de duplicados.
import { describe, expect, it } from "vitest";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { AddCardToDeckUseCase } from "./AddCardToDeckUseCase";
import { SaveDeckUseCase } from "./SaveDeckUseCase";

const VALID_20_CARD_IDS = [
  "entity-ollama",
  "entity-python",
  "entity-react",
  "entity-postgress",
  "entity-supabase",
  "entity-huggenface",
  "entity-perplexity",
  "entity-kali-linux",
  "entity-astro",
  "entity-deepseek",
  "entity-vscode",
  "entity-cursor",
  "entity-nextjs",
  "entity-claude",
  "entity-git",
  "entity-github",
  "entity-chatgpt",
  "entity-gemini",
  "entity-vercel",
  "entity-openclaw",
];

describe("SaveDeckUseCase", () => {
  it("bloquea guardado si faltan cartas en el deck", async () => {
    const repository = new InMemoryDeckRepository();
    const saveDeckUseCase = new SaveDeckUseCase(repository);

    await expect(saveDeckUseCase.execute("player-a")).rejects.toThrow("El deck debe tener 20 cartas");
  });

  it("permite guardar cuando el deck tiene 20 cartas válidas", async () => {
    const repository = new InMemoryDeckRepository();
    const addCardUseCase = new AddCardToDeckUseCase(repository);
    const saveDeckUseCase = new SaveDeckUseCase(repository);
    for (const cardId of VALID_20_CARD_IDS) {
      await addCardUseCase.execute({ playerId: "player-a", cardId });
    }

    const deck = await saveDeckUseCase.execute("player-a");
    expect(deck.slots.filter((slot) => slot.cardId !== null)).toHaveLength(20);
  });
});
