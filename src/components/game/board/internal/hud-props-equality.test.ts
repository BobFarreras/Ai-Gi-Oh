// src/components/game/board/internal/hud-props-equality.test.ts - Verifica el comparador de igualdad del HUD de jugador.
import { describe, expect, it, vi } from "vitest";
import { IPlayer } from "@/core/entities/IPlayer";
import { areEqualPlayerHudProps } from "./hud-props-equality";
import type { PlayerHUDProps } from "@/components/game/board/PlayerHUD";

function createPlayer(overrides: Partial<IPlayer> = {}): IPlayer {
  return {
    id: "p1",
    name: "Jugador",
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 3,
    maxEnergy: 5,
    hand: [],
    deck: [],
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
    ...overrides,
  } as IPlayer;
}

function baseProps(overrides: Partial<PlayerHUDProps> = {}): PlayerHUDProps {
  return {
    isOpponent: false,
    player: createPlayer(),
    isActiveTurn: true,
    onAdvancePhase: vi.fn(),
    ...overrides,
  };
}

describe("areEqualPlayerHudProps", () => {
  it("es igual cuando el objeto player cambia de referencia pero sus stats no", () => {
    const previous = baseProps();
    const next = baseProps({ player: createPlayer(), onAdvancePhase: previous.onAdvancePhase });
    expect(areEqualPlayerHudProps(previous, next)).toBe(true);
  });

  it("no es igual cuando cambian los LP", () => {
    const previous = baseProps();
    const next = baseProps({ player: createPlayer({ healthPoints: 7000 }), onAdvancePhase: previous.onAdvancePhase });
    expect(areEqualPlayerHudProps(previous, next)).toBe(false);
  });

  it("no es igual cuando cambia la energía o el turno", () => {
    const previous = baseProps();
    expect(
      areEqualPlayerHudProps(previous, baseProps({ player: createPlayer({ currentEnergy: 4 }), onAdvancePhase: previous.onAdvancePhase })),
    ).toBe(false);
    expect(areEqualPlayerHudProps(previous, baseProps({ isActiveTurn: false, onAdvancePhase: previous.onAdvancePhase }))).toBe(false);
  });

  it("no es igual cuando llega un nuevo pulso de daño", () => {
    const previous = baseProps({ damagePulseKey: "evt-1" });
    const next = baseProps({ damagePulseKey: "evt-2", onAdvancePhase: previous.onAdvancePhase });
    expect(areEqualPlayerHudProps(previous, next)).toBe(false);
  });

  it("trata estilos inline equivalentes como iguales (HUD móvil)", () => {
    const previous = baseProps({ containerStyle: { top: "10px" } });
    const next = baseProps({ containerStyle: { top: "10px" }, onAdvancePhase: previous.onAdvancePhase });
    expect(areEqualPlayerHudProps(previous, next)).toBe(true);
  });
});
