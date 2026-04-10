// src/core/services/opponent/select-opponent-play.test.ts - Verifica que la IA priorice presión ofensiva realista en fase principal.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { getDifficultyProfile } from "@/core/services/opponent/difficulty/difficultyProfiles";
import { buildPlayableCardDecisions } from "@/core/services/opponent/select-opponent-play";

function entityCard(id: string, attack: number, defense: number): ICard {
  return { id, name: id, description: id, type: "ENTITY", faction: "NEUTRAL", cost: 3, attack, defense };
}

function player(id: string): IPlayer {
  return {
    id,
    name: id,
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    hand: [],
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
  };
}

describe("buildPlayableCardDecisions", () => {
  it("elige modo ATTACK para presionar cuando no hay atacante propio y estilo es agresivo", () => {
    const opponent = player("bot");
    const target = player("player");
    opponent.hand = [entityCard("bot-striker", 1900, 2100)];
    const decisions = buildPlayableCardDecisions({
      opponent,
      target,
      profile: getDifficultyProfile("MYTHIC"),
      aiProfile: { style: "aggressive", aggression: 0.7 },
    });
    expect(decisions[0]?.mode).toBe("ATTACK");
  });

  it("mantiene DEFENSE cuando la carta es claramente muro y estilo no presiona", () => {
    const opponent = player("bot");
    const target = player("player");
    target.activeEntities = [{ instanceId: "enemy-1", card: entityCard("enemy-1", 1700, 1000), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }];
    opponent.hand = [entityCard("bot-wall", 1200, 2400)];
    const decisions = buildPlayableCardDecisions({
      opponent,
      target,
      profile: getDifficultyProfile("NORMAL"),
      aiProfile: { style: "control", aggression: 0.35 },
    });
    expect(decisions[0]?.mode).toBe("DEFENSE");
  });
});
