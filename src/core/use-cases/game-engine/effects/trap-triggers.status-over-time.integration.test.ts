// src/core/use-cases/game-engine/effects/trap-triggers.status-over-time.integration.test.ts - Verifica #10/#11:
// trampas ON_OPPONENT_TRAP_ACTIVATED que aplican daño (Bandera Windows) / curación (Abrazo Hugging) por turno.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  attackerCard,
  createTrapBaseState,
  createTrapEntity,
  trapHuggingHeal,
  trapOnAttack,
  trapWindowsInfect,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";

// p1 ataca → la trampa de p2 se activa (ON_OPPONENT_ATTACK_DECLARED); la trampa de estado de p1 (actor)
// reacciona a esa activación (ON_OPPONENT_TRAP_ACTIVATED).
function buildState(playerAStatusTrap: GameState["playerA"]["activeExecutions"][number]): GameState {
  const base = createTrapBaseState();
  return {
    ...base,
    playerA: {
      ...base.playerA,
      healthPoints: 5000,
      activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")],
      activeExecutions: [playerAStatusTrap],
    },
    playerB: {
      ...base.playerB,
      activeExecutions: [createTrapEntity("t-src", trapOnAttack)],
    },
  };
}

describe("Trap status-over-time reactions (#10 Windows / #11 Hugging)", () => {
  it("Bandera Windows infecta al rival con daño por turno hasta el final del duelo", () => {
    const state = buildState(createTrapEntity("windows", trapWindowsInfect));
    const afterAttack = GameEngine.executeAttack(state, "p1", "a1");

    // La trampa Windows se consumió y aplicó un estado DAMAGE_OVER_TIME contra el rival (p2).
    expect(afterAttack.playerA.activeExecutions.some((entity) => entity.card.id === "trap-windows-flag-infect")).toBe(false);
    expect(afterAttack.playerA.graveyard.some((card) => card.id === "trap-windows-flag-infect")).toBe(true);
    const dot = afterAttack.activeStatusEffects?.find((status) => status.kind === "DAMAGE_OVER_TIME");
    expect(dot).toMatchObject({ targetPlayerId: "p2", remainingTurns: null, magnitude: 300 });
    expect(afterAttack.combatLog.some((event) => event.eventType === "STATUS_EFFECT_APPLIED")).toBe(true);

    // Al inicio del turno de p2, el DoT resta 300 PV (independiente del daño del ataque).
    const hpBefore = afterAttack.playerB.healthPoints;
    const afterTurn = GameEngine.nextPhase(afterAttack);
    expect(afterTurn.activePlayerId).toBe("p2");
    expect(afterTurn.playerB.healthPoints).toBe(hpBefore - 300);
    expect(afterTurn.combatLog.some((event) => event.eventType === "DIRECT_DAMAGE" && (event.payload as Record<string, unknown>).source === "STATUS_DAMAGE_OVER_TIME")).toBe(true);

    // Persiste: vuelve a restar 300 en el siguiente turno de p2.
    const afterP2Battle = GameEngine.nextPhase(afterTurn); // p2 MAIN_1 → BATTLE
    const backToP1 = GameEngine.nextPhase(afterP2Battle); // BATTLE → p1 MAIN_1
    const secondP2Turn = GameEngine.nextPhase(GameEngine.nextPhase(backToP1)); // p1 MAIN_1→BATTLE→p2 MAIN_1
    expect(secondP2Turn.activePlayerId).toBe("p2");
    expect(secondP2Turn.playerB.healthPoints).toBe(hpBefore - 600);
  });

  it("Abrazo Hugging cura al dueño por turno hasta el final del duelo", () => {
    const state = buildState(createTrapEntity("hugging", trapHuggingHeal));
    const afterAttack = GameEngine.executeAttack(state, "p1", "a1");

    expect(afterAttack.playerA.graveyard.some((card) => card.id === "trap-hugging-heal")).toBe(true);
    const hot = afterAttack.activeStatusEffects?.find((status) => status.kind === "HEAL_OVER_TIME");
    expect(hot).toMatchObject({ targetPlayerId: "p1", remainingTurns: null, magnitude: 300 });

    // p1 fue golpeado por la trampa de p2 (5000 → 4500). En su próximo turno, el HoT cura +300 → 4800.
    expect(afterAttack.playerA.healthPoints).toBe(4500);
    const afterP2 = GameEngine.nextPhase(afterAttack); // BATTLE → p2 MAIN_1
    const p2Battle = GameEngine.nextPhase(afterP2); // p2 MAIN_1 → BATTLE
    const backToP1 = GameEngine.nextPhase(p2Battle); // BATTLE → p1 MAIN_1
    expect(backToP1.activePlayerId).toBe("p1");
    expect(backToP1.playerA.healthPoints).toBe(4800);
    expect(backToP1.combatLog.some((event) => event.eventType === "HEAL_APPLIED" && (event.payload as Record<string, unknown>).source === "STATUS_HEAL_OVER_TIME")).toBe(true);
  });

  it("no re-dispara en cadena: la trampa de estado solo se activa una vez", () => {
    const state = buildState(createTrapEntity("windows", trapWindowsInfect));
    const afterAttack = GameEngine.executeAttack(state, "p1", "a1");
    const statusApplied = afterAttack.combatLog.filter((event) => event.eventType === "STATUS_EFFECT_APPLIED");
    expect(statusApplied).toHaveLength(1);
    expect(afterAttack.activeStatusEffects?.filter((status) => status.kind === "DAMAGE_OVER_TIME")).toHaveLength(1);
  });
});
