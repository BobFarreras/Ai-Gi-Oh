// src/core/services/opponent/opponent-synergy.test.ts - Ficha 5 fase 5: la IA valora las piezas de combo
// según si sus compañeras están en juego (combo TypeScript + magia de atacar en defensa).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { resolveSynergyBonus } from "./opponent-synergy";

const typescriptShield: ICard = {
  id: "trap-typescript-shield", name: "Escudo TypeScript", description: "", type: "TRAP", faction: "OPEN_SOURCE",
  cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "REINFORCE_LINKED_ENTITY_ON_ATTACK", linkedCardId: "entity-typescript", value: 1000 },
};
const defenseAttackMagic: ICard = {
  id: "exec-escudo-firewall-ofensivo", name: "Firewall Ofensivo", description: "", type: "EXECUTION", faction: "OPEN_SOURCE",
  cost: 2, effect: { action: "ALLOW_DEFENSE_MODE_ATTACK" },
};
const typescriptEntity: ICard = { id: "entity-typescript", name: "TypeScript", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 4, attack: 1500, defense: 1100 };

function board(instanceId: string, card: ICard, mode: IBoardEntity["mode"] = "ATTACK"): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}
function bot(overrides: Partial<IPlayer>): IPlayer {
  return { id: "bot", name: "bot", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [], ...overrides };
}

describe("resolveSynergyBonus (ficha 5 fase 5)", () => {
  it("Escudo TypeScript: fuerte bonus con la entity ligada en mesa, castigo si no la tienes", () => {
    expect(resolveSynergyBonus(typescriptShield, bot({ activeEntities: [board("ts", typescriptEntity, "DEFENSE")] }))).toBeGreaterThan(500);
    expect(resolveSynergyBonus(typescriptShield, bot({ hand: [{ ...typescriptEntity }] }))).toBeGreaterThan(0); // vendrá pronto
    expect(resolveSynergyBonus(typescriptShield, bot({}))).toBeLessThan(0); // trampa muerta: no setear
  });

  it("Escudo TypeScript en mano vale MÁS con la entity en mesa que sin ella", () => {
    const conEntity = resolveSynergyBonus(typescriptShield, bot({ activeEntities: [board("ts", typescriptEntity, "DEFENSE")] }));
    const sinEntity = resolveSynergyBonus(typescriptShield, bot({}));
    expect(conEntity).toBeGreaterThan(sinEntity + 1000);
  });

  it("Atacar en defensa: bonus creciente con muros en defensa, castigo sin ellos", () => {
    const wall = { id: "wall", name: "Wall", description: "", type: "ENTITY" as const, faction: "NEUTRAL" as const, cost: 4, attack: 800, defense: 1600 };
    expect(resolveSynergyBonus(defenseAttackMagic, bot({}))).toBeLessThan(0); // sin muros: inútil
    const unMuro = resolveSynergyBonus(defenseAttackMagic, bot({ activeEntities: [board("w1", wall, "DEFENSE")] }));
    const dosMuros = resolveSynergyBonus(defenseAttackMagic, bot({ activeEntities: [board("w1", wall, "DEFENSE"), board("w2", { ...wall, id: "wall2" }, "DEFENSE")] }));
    expect(unMuro).toBeGreaterThan(0);
    expect(dosMuros).toBeGreaterThan(unMuro);
  });

  it("cartas sin efecto de combo no reciben ajuste", () => {
    expect(resolveSynergyBonus(typescriptEntity, bot({}))).toBe(0);
  });
});
