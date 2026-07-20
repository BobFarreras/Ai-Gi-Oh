// src/components/game/board/hooks/internal/player-actions/handleOpponentEntityClick.test.ts - Garantiza reveal breve al atacar una carta oculta rival.
import { describe, expect, it, vi } from "vitest";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  attackerCard,
  createTrapBaseState,
  createTrapEntity,
  trapNegateAttack,
  trapOnAttack,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";
import { handleOpponentEntityClick } from "./handleOpponentEntityClick";

/** p1 (local, atacante) vs p2 (rival, defensor) con DOS trampas reactivas ON_OPPONENT_ATTACK_DECLARED. */
function stateWithDefenderTraps(): GameState {
  const base = createTrapBaseState();
  return {
    ...base,
    playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")] },
    playerB: { ...base.playerB, activeExecutions: [createTrapEntity("t1", trapOnAttack), createTrapEntity("t2", trapNegateAttack)] },
  };
}

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "A",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "attacker-1",
          card: { id: "atk-1", name: "Atacante", description: "x", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1500 },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "B",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "target-set",
          card: { id: "def-1", name: "Defensora", description: "x", type: "ENTITY", faction: "NEUTRAL", cost: 1, defense: 1600 },
          mode: "SET",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
    combatLog: [],
    pendingTurnAction: null,
  };
}

describe("handleOpponentEntityClick", () => {
  it("debería revelar y ocultar objetivo SET durante la secuencia de ataque", async () => {
    const state = createState();
    const target: IBoardEntity = {
      instanceId: "target-set",
      card: { id: "c1", name: "Oculta", description: "x", type: "ENTITY", faction: "NEUTRAL", cost: 1 },
      mode: "SET",
      hasAttackedThisTurn: false,
      isNewlySummoned: false,
    };
    const setRevealedEntities = vi.fn();

    await handleOpponentEntityClick({
      entity: target,
      activeAttackerId: "attacker-1",
      applyTransition: (transition) => transition(state),
      requestTrapActivationDecision: vi.fn(async () => ({ activate: false })),
      clearSelection: vi.fn(),
      gameState: state,
      setActiveAttackerId: vi.fn(),
      setIsAnimating: vi.fn(),
      setRevealedEntities,
      setSelectedCard: vi.fn(),
      isMultiplayer: false,
      emitLocalAction: vi.fn(),
    });

    expect(setRevealedEntities).toHaveBeenCalledTimes(2);
  });

  it("multi: DIFIERE la trampa reactiva del rival, emite ATTACK con deferReactiveTraps y deja el tablero bloqueado", async () => {
    const state = stateWithDefenderTraps();
    const holder: { applied: GameState | null } = { applied: null };
    const applyTransition = vi.fn((transition: (s: GameState) => GameState) => {
      holder.applied = transition(state);
      return holder.applied;
    });
    const emitLocalAction = vi.fn();
    const setIsAnimating = vi.fn();
    const requestTrapActivationDecision = vi.fn(async () => ({ activate: false }));

    const result = await handleOpponentEntityClick({
      entity: null, // ataque directo (el rival no tiene entities, solo trampas)
      activeAttackerId: "a1",
      applyTransition,
      requestTrapActivationDecision,
      clearSelection: vi.fn(),
      gameState: state,
      setActiveAttackerId: vi.fn(),
      setIsAnimating,
      setRevealedEntities: vi.fn(),
      setSelectedCard: vi.fn(),
      isMultiplayer: true,
      emitLocalAction,
    });

    expect(result).toBe("handled");
    // El estado local queda en pausa (no se resolvió el ataque).
    expect(holder.applied?.pendingReactiveTrapDecision?.defenderPlayerId).toBe("p2");
    expect(holder.applied?.playerB.healthPoints).toBe(8000);
    // Se emite el ATTACK diferido para que el defensor elija en su cliente.
    expect(emitLocalAction).toHaveBeenCalledTimes(1);
    const emitted = emitLocalAction.mock.calls[0][0];
    expect(emitted.type).toBe("ATTACK");
    expect(emitted.payload.attackerInstanceId).toBe("a1");
    expect(emitted.payload.deferReactiveTraps).toBe(true);
    expect(emitted.payload.declineCounterTrap).toBeUndefined();
    // Sin contra-trampa propia, no se pregunta nada al atacante.
    expect(requestTrapActivationDecision).not.toHaveBeenCalled();
    // El tablero NO se desbloquea: espera la decisión remota (nunca isAnimating(false)).
    expect(setIsAnimating).not.toHaveBeenCalledWith(false);
  });

  it("single-player: NO difiere; resuelve el ataque en el sitio (auto-primera trampa)", async () => {
    const state = stateWithDefenderTraps();
    const holder: { applied: GameState | null } = { applied: null };
    const applyTransition = vi.fn((transition: (s: GameState) => GameState) => {
      holder.applied = transition(state);
      return holder.applied;
    });
    const emitLocalAction = vi.fn();

    await handleOpponentEntityClick({
      entity: null,
      activeAttackerId: "a1",
      applyTransition,
      requestTrapActivationDecision: vi.fn(async () => ({ activate: false })),
      clearSelection: vi.fn(),
      gameState: state,
      setActiveAttackerId: vi.fn(),
      setIsAnimating: vi.fn(),
      setRevealedEntities: vi.fn(),
      setSelectedCard: vi.fn(),
      isMultiplayer: false,
      emitLocalAction,
    });

    // Sin diferir: no hay pausa y la primera trampa (daño 500) ya se resolvió (defensor = playerB).
    expect(holder.applied?.pendingReactiveTrapDecision).toBeUndefined();
    expect(holder.applied?.playerB.graveyard.map((card) => card.id)).toContain("trap-on-attack");
    // El emit no lleva deferReactiveTraps en single-player (fuera de multi el emisor es noop de todos modos).
    expect(emitLocalAction.mock.calls[0]?.[0].payload.deferReactiveTraps).toBeUndefined();
  });
});
