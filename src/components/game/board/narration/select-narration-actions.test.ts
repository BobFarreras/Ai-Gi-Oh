// src/components/game/board/narration/select-narration-actions.test.ts - Prueba selección de acciones narrativas desde eventos de combate y cierre de duelo.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { describe, expect, it } from "vitest";
import { buildDefaultMatchNarrationPack } from "./build-default-match-narration-pack";
import { selectNarrationActionForResult, selectNarrationActionsFromEvents } from "./select-narration-actions";

const pack = buildDefaultMatchNarrationPack();
const context = { playerId: "player", opponentId: "opponent" };

function event(seed: Partial<ICombatLogEvent>): ICombatLogEvent {
  return {
    id: seed.id ?? "e1",
    turn: 1,
    phase: "MAIN_1",
    actorPlayerId: seed.actorPlayerId ?? "player",
    eventType: seed.eventType ?? "TURN_STARTED",
    payload: seed.payload ?? {},
    timestamp: seed.timestamp ?? new Date().toISOString(),
  };
}

describe("selectNarrationActionsFromEvents", () => {
  it("selecciona inicio, impacto directo y fusión", () => {
    const actions = selectNarrationActionsFromEvents(
      [
        event({ id: "s", eventType: "TURN_STARTED", actorPlayerId: "opponent" }),
        event({ id: "d", eventType: "BATTLE_RESOLVED", actorPlayerId: "player", payload: { attackerCardId: "a" } }),
        event({ id: "t", eventType: "TRAP_TRIGGERED", actorPlayerId: "opponent" }),
        event({ id: "f", eventType: "FUSION_SUMMONED", actorPlayerId: "player" }),
      ],
      pack,
      context,
    );
    expect(actions).toHaveLength(4);
    expect(actions.map((action) => action.line.trigger)).toEqual(["MATCH_START", "DIRECT_HIT_DEALT", "OPPONENT_TRAP_TRIGGERED", "FUSION_SUMMONED"]);
  });

  it("selecciona narración final según ganador", () => {
    const winAction = selectNarrationActionForResult("player", pack, context);
    const loseAction = selectNarrationActionForResult("opponent", pack, context);
    expect(winAction?.line.trigger).toBe("PLAYER_WIN");
    expect(loseAction?.line.trigger).toBe("PLAYER_LOSE");
  });
});
