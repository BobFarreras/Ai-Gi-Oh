// src/core/services/opponent/opponent-zone-replacement.test.ts - Ficha 5 fase 3: reemplazo con zona llena.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { chooseEntityZoneReplacement, chooseExecutionZoneReplacement } from "./opponent-zone-replacement";

function entity(id: string, attack: number, defense: number, cost = 3): ICard {
  return { id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost, attack, defense };
}
function trap(id: string, cost = 2): ICard {
  return { id, name: id, description: "", type: "TRAP", faction: "NEUTRAL", cost, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" } };
}
function board(instanceId: string, card: ICard, mode: IBoardEntity["mode"] = "ATTACK"): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}
function player(overrides: Partial<IPlayer>): IPlayer {
  return { id: "bot", name: "bot", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 10, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [], ...overrides };
}

describe("reemplazo de zona llena (ficha 5 fase 3)", () => {
  it("con 3 entities y una nueva claramente mejor, devuelve la PEOR para sustituirla", () => {
    const bot = player({ activeEntities: [board("e1", entity("weak", 800, 700)), board("e2", entity("mid", 1500, 1100)), board("e3", entity("mid2", 1400, 1200))] });
    // Nueva entity muy superior (cuerpo alto) → supera a la peor (e1) con holgura.
    expect(chooseEntityZoneReplacement(bot, entity("strong", 2500, 1700, 6))).toBe("e1");
  });

  it("no reemplaza si la nueva no supera a la peor por el margen (evita churn)", () => {
    const bot = player({ activeEntities: [board("e1", entity("a", 1500, 1100)), board("e2", entity("b", 1500, 1100)), board("e3", entity("c", 1500, 1100))] });
    expect(chooseEntityZoneReplacement(bot, entity("marginal", 1600, 1100))).toBeNull();
  });

  it("con la zona no llena (<3) no reemplaza nada", () => {
    const bot = player({ activeEntities: [board("e1", entity("a", 1500, 1100))] });
    expect(chooseEntityZoneReplacement(bot, entity("strong", 2500, 1700, 6))).toBeNull();
  });

  it("reemplaza la peor magia/trampa, pero NUNCA una en modo ACTIVATE", () => {
    const bot = player({ activeExecutions: [board("x1", trap("cheap", 1), "SET"), board("x2", trap("mid", 3), "SET"), board("x3", trap("activating", 2), "ACTIVATE")] });
    // La activándose (x3) queda intocable aunque sea "peor"; se sustituye la más floja SET (x1).
    expect(chooseExecutionZoneReplacement(bot, trap("premium", 6))).toBe("x1");
  });
});
