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

  it("ficha 5 fase 2: TODOS los perfiles invocan en DEFENSA una entity que perdería el intercambio (evita el trample)", () => {
    // Rival con atacante EN ATAQUE de 2600. La entity del bot (1500 ATK) no gana el intercambio: en ataque
    // solo se expondría al trample. Antes solo MASTER/MYTHIC lo evitaban; ahora también NORMAL/EASY.
    for (const difficulty of ["EASY", "NORMAL", "HARD", "MASTER"] as const) {
      const opponent = player("bot");
      const target = player("player");
      target.activeEntities = [{ instanceId: "enemy-strong", card: entityCard("enemy-strong", 2600, 1600), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }];
      opponent.hand = [entityCard("bot-mid", 1500, 1100)];
      const decisions = buildPlayableCardDecisions({
        opponent,
        target,
        profile: getDifficultyProfile(difficulty),
        aiProfile: { style: "balanced", aggression: 0.5 },
      });
      expect(decisions[0]?.mode, `perfil ${difficulty}`).toBe("DEFENSE");
    }
  });

  it("ficha 5 fase 2: la amenaza en DEFENSA/SET no fuerza defensa (no ataca, no hay trample que evitar)", () => {
    // El rival de 2600 está en DEFENSA: no puede golpear a la recién invocada, así que el bot desarrolla en
    // ataque con normalidad (attack >= defense) en vez de encogerse sin motivo.
    const opponent = player("bot");
    const target = player("player");
    target.activeEntities = [{ instanceId: "enemy-wall", card: entityCard("enemy-wall", 2600, 1600), mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false }];
    opponent.hand = [entityCard("bot-mid", 1500, 1100)];
    const decisions = buildPlayableCardDecisions({
      opponent,
      target,
      profile: getDifficultyProfile("NORMAL"),
      aiProfile: { style: "balanced", aggression: 0.5 },
    });
    expect(decisions[0]?.mode).toBe("ATTACK");
  });
});
