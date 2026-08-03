// src/components/game/board/hooks/internal/progression/build-card-experience-events.test.ts - Pruebas de mapeo de eventos de combate a eventos de EXP por carta.
import { describe, expect, it } from "vitest";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { buildCardExperienceEvents } from "./build-card-experience-events";

function createEvent(eventType: ICombatLogEvent["eventType"], actorPlayerId: string, payload: Record<string, unknown>): ICombatLogEvent {
  return {
    id: `${eventType}-${Math.random()}`,
    turn: 1,
    phase: "MAIN_1",
    actorPlayerId,
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  };
}

describe("build-card-experience-events", () => {
  it("mapea invocación, activación y golpe directo del jugador activo", () => {
    const logs: ICombatLogEvent[] = [
      createEvent("CARD_PLAYED", "p1", { cardId: "entity-python", cardType: "ENTITY", mode: "ATTACK" }),
      createEvent("CARD_PLAYED", "p1", { cardId: "exec-1", cardType: "EXECUTION", mode: "ACTIVATE" }),
      createEvent("BATTLE_RESOLVED", "p1", {
        attackerCardId: "entity-python",
        defenderCardId: null,
        defenderDestroyed: false,
        damageToDefenderPlayer: 1200,
      }),
    ];
    expect(buildCardExperienceEvents(logs, "p1", new Set(["entity-python", "exec-1"]))).toEqual([
      { cardId: "entity-python", eventType: "SUMMON_SUCCESS" },
      { cardId: "exec-1", eventType: "ACTIVATE_EFFECT" },
      { cardId: "entity-python", eventType: "DIRECT_HIT" },
    ]);
  });

  it("ignora eventos del oponente y detecta destrucción de entidad enemiga", () => {
    const logs: ICombatLogEvent[] = [
      createEvent("BATTLE_RESOLVED", "p2", {
        attackerCardId: "entity-opponent",
        defenderCardId: "entity-player",
        defenderDestroyed: true,
        damageToDefenderPlayer: 0,
      }),
      createEvent("BATTLE_RESOLVED", "p1", {
        attackerCardId: "entity-react",
        defenderCardId: "entity-enemy",
        defenderDestroyed: true,
        damageToDefenderPlayer: 0,
      }),
    ];
    expect(buildCardExperienceEvents(logs, "p1", new Set(["entity-react"]))).toEqual([
      { cardId: "entity-react", eventType: "DESTROY_ENEMY_ENTITY" },
    ]);
  });

  it("excluye cartas robadas del oponente que no pertenecen al jugador", () => {
    const logs: ICombatLogEvent[] = [
      createEvent("CARD_PLAYED", "p1", { cardId: "entity-python", cardType: "ENTITY", mode: "ATTACK" }),
      createEvent("CARD_PLAYED", "p1", { cardId: "entity-stolen-opponent", cardType: "ENTITY", mode: "ATTACK" }),
      createEvent("BATTLE_RESOLVED", "p1", {
        attackerCardId: "entity-stolen-opponent",
        defenderCardId: null,
        defenderDestroyed: false,
        damageToDefenderPlayer: 800,
      }),
    ];
    const ownedCardIds = new Set(["entity-python", "entity-react", "exec-1"]);
    const events = buildCardExperienceEvents(logs, "p1", ownedCardIds);
    expect(events).toEqual([
      { cardId: "entity-python", eventType: "SUMMON_SUCCESS" },
    ]);
  });

  it("no acredita experiencia cuando la instantánea de propiedad está vacía", () => {
    const logs: ICombatLogEvent[] = [
      createEvent("CARD_PLAYED", "p1", { cardId: "entity-stolen", cardType: "ENTITY", mode: "ATTACK" }),
    ];
    expect(buildCardExperienceEvents(logs, "p1", new Set())).toEqual([]);
  });
});

