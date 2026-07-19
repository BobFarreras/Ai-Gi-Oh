// opponent-fusion-energy.test.ts - La IA ahorra energía para activar una fusión ya lista (par en mesa + exec
// en mano sin energía suficiente): espera el turno en vez de malgastar la energía. Petición del usuario.
import { describe, expect, it } from "vitest";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ICard } from "@/core/entities/ICard";
import { shouldHoldEnergyForFusion } from "./opponent-fusion-plan";

const python: ICard = { id: "entity-python", name: "Python", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 1100, archetype: "LANGUAGE" };
const postgress: ICard = { id: "entity-postgress", name: "Postgress", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 4, attack: 1500, defense: 1100, archetype: "DB" };
const exec: ICard = { id: "exec-fusion-pytgress", name: "Fusion", description: "", type: "EXECUTION", faction: "OPEN_SOURCE", cost: 4, effect: { action: "FUSION_SUMMON", recipeId: "fusion-pytgress", materialsRequired: 2 } };
const pytgress: ICard = { id: "fusion-pytgress", name: "Pytgress", description: "", type: "FUSION", faction: "OPEN_SOURCE", cost: 6, attack: 2900, defense: 2700 };

function be(id: string, card: ICard): IBoardEntity {
  return { instanceId: id, card, mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false };
}
function bot(overrides: Partial<IPlayer>): IPlayer {
  return { id: "bot", name: "bot", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 2, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [], fusionDeck: [{ ...pytgress }], ...overrides };
}
const noThreat: IPlayer = bot({ id: "rival" });

describe("shouldHoldEnergyForFusion", () => {
  it("par en mesa + exec en mano sin energía → espera (ahorra energía)", () => {
    const b = bot({ currentEnergy: 2, activeEntities: [be("m1", python), be("m2", postgress)], hand: [{ ...exec }] });
    expect(shouldHoldEnergyForFusion(b, noThreat)).toBe(true);
  });

  it("con energía suficiente NO espera (activa este turno)", () => {
    const b = bot({ currentEnergy: 6, activeEntities: [be("m1", python), be("m2", postgress)], hand: [{ ...exec }] });
    expect(shouldHoldEnergyForFusion(b, noThreat)).toBe(false);
  });

  it("si la exec ya está SET en mesa (reactivar es gratis) NO hace falta esperar", () => {
    const b = bot({ currentEnergy: 2, activeEntities: [be("m1", python), be("m2", postgress)], activeExecutions: [{ instanceId: "s", card: { ...exec }, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false }] });
    expect(shouldHoldEnergyForFusion(b, noThreat)).toBe(false);
  });

  it("sin el par en mesa NO espera (aún no hay fusión lista)", () => {
    const b = bot({ currentEnergy: 2, activeEntities: [be("m1", python)], hand: [{ ...exec }] });
    expect(shouldHoldEnergyForFusion(b, noThreat)).toBe(false);
  });

  it("bajo amenaza letal NO se pone a ahorrar", () => {
    const b = bot({ currentEnergy: 2, healthPoints: 1500, activeEntities: [be("m1", python), be("m2", postgress)], hand: [{ ...exec }] });
    const lethal = bot({ id: "rival", activeEntities: [{ instanceId: "k", card: { ...postgress, id: "killer", attack: 2000 }, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }] });
    expect(shouldHoldEnergyForFusion(b, lethal)).toBe(false);
  });
});
