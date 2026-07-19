// src/core/services/opponent/opponent-bait-trap.test.ts - Ficha 5 fase 5 (2º caso del usuario): la IA retrasa
// invocar para cebar una trampa reactiva de ataque-directo (Flutter Enjambre) en vez de bloquear con una entity.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { shouldHoldToBaitReactiveTrap } from "./opponent-tactical-context";

const summon: ICard = { id: "e", name: "E", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1400, defense: 1000 };
const flutter: ICard = { id: "trap-flutter-reflect", name: "Flutter Enjambre", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_DIRECT_ATTACK_DECLARED", effect: { action: "REFLECT_DIRECT_DAMAGE" } };
const normalTrap: ICard = { id: "trap-x", name: "X", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "REINFORCE_LINKED_ENTITY_ON_ATTACK", linkedCardId: "z", value: 500 } };

function be(instanceId: string, card: ICard, mode: IBoardEntity["mode"]): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}
function player(overrides: Partial<IPlayer>): IPlayer {
  return { id: "p", name: "p", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [], ...overrides };
}
const rivalWithAttacker = player({ id: "r", activeEntities: [be("r1", { ...summon, id: "r-atk" }, "ATTACK")] });

describe("shouldHoldToBaitReactiveTrap (ficha 5 fase 5)", () => {
  it("retiene la invocación con Flutter armada, tablero vacío y rival capaz de atacar directo", () => {
    const bot = player({ activeExecutions: [be("t", flutter, "SET")] });
    expect(shouldHoldToBaitReactiveTrap({ card: summon, mode: "ATTACK", opponent: bot, target: rivalWithAttacker })).toBe(true);
    expect(shouldHoldToBaitReactiveTrap({ card: summon, mode: "DEFENSE", opponent: bot, target: rivalWithAttacker })).toBe(true);
  });

  it("NO retiene si ya hay una entity en mesa (el rival ya no ataca directo)", () => {
    const bot = player({ activeEntities: [be("b1", summon, "DEFENSE")], activeExecutions: [be("t", flutter, "SET")] });
    expect(shouldHoldToBaitReactiveTrap({ card: summon, mode: "ATTACK", opponent: bot, target: rivalWithAttacker })).toBe(false);
  });

  it("NO retiene si el rival no puede atacar directo (sin atacantes)", () => {
    const bot = player({ activeExecutions: [be("t", flutter, "SET")] });
    const rivalNoAttacker = player({ id: "r", activeEntities: [be("r1", { ...summon, id: "r-def" }, "DEFENSE")] });
    expect(shouldHoldToBaitReactiveTrap({ card: summon, mode: "ATTACK", opponent: bot, target: rivalNoAttacker })).toBe(false);
  });

  it("NO retiene si la trampa armada no es de ataque-directo (una normal SÍ debe bloquearse con entity)", () => {
    const bot = player({ activeExecutions: [be("t", normalTrap, "SET")] });
    expect(shouldHoldToBaitReactiveTrap({ card: summon, mode: "ATTACK", opponent: bot, target: rivalWithAttacker })).toBe(false);
  });

  it("NO retiene una fusión (swing valioso) ni una activación (no rompe el cebo)", () => {
    const bot = player({ activeExecutions: [be("t", flutter, "SET")] });
    expect(shouldHoldToBaitReactiveTrap({ card: { ...summon, type: "FUSION" }, mode: "ATTACK", opponent: bot, target: rivalWithAttacker })).toBe(false);
    expect(shouldHoldToBaitReactiveTrap({ card: summon, mode: "SET", opponent: bot, target: rivalWithAttacker })).toBe(false);
  });
});
