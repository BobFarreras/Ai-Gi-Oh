// src/components/game/board/battlefield/TrapActivationVfx.test.tsx - Verifica el presupuesto visual de trampas en dispositivos limitados.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrapActivationVfx } from "./TrapActivationVfx";
import { IBoardEntity } from "@/core/entities/IPlayer";

vi.mock("@/components/game/board/internal/use-board-performance-profile", () => ({
  useBoardPerformanceProfile: () => ({
    isMobileViewport: false,
    shouldReduceCombatEffects: false,
    combatEffectsBudget: "FULL",
  }),
}));
vi.mock("./DigitalBeam", () => ({ DigitalBeam: () => <div>Beam completo</div> }));
vi.mock("@/components/game/board/battlefield/internal/ChargeCastVfx", () => ({
  ChargeCastVfx: () => <div>Carga completa</div>,
}));
vi.mock("@/components/game/board/battlefield/internal/ChargeCastSfx", () => ({
  ChargeCastSfx: () => null,
}));

const DAMAGE_TRAP: IBoardEntity = {
  instanceId: "trap-1",
  card: {
    id: "trap-damage",
    name: "Trampa",
    description: "Daño",
    type: "TRAP",
    faction: "NEUTRAL",
    cost: 2,
    effect: { action: "DAMAGE", value: 600, target: "OPPONENT" },
  },
  mode: "ACTIVATE",
  hasAttackedThisTurn: false,
  isNewlySummoned: false,
};

describe("TrapActivationVfx", () => {
  it("mantiene feedback funcional y desmonta las capas caras en REDUCED", () => {
    render(
      <TrapActivationVfx
        entity={DAMAGE_TRAP}
        isOpponentSide
        isTrapActivating
        effectsBudget="REDUCED"
      />,
    );

    expect(screen.getByText("DMG")).toBeInTheDocument();
    expect(screen.queryByText("Beam completo")).not.toBeInTheDocument();
    expect(screen.queryByText("Carga completa")).not.toBeInTheDocument();
  });

  it("conserva el VFX completo en FULL", () => {
    render(
      <TrapActivationVfx
        entity={DAMAGE_TRAP}
        isOpponentSide
        isTrapActivating
        effectsBudget="FULL"
      />,
    );

    expect(screen.getByText("Beam completo")).toBeInTheDocument();
    expect(screen.getByText("Carga completa")).toBeInTheDocument();
  });
});
