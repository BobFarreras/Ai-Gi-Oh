// src/components/game/board/multiplayer/ReactiveTrapDecisionTimer.test.tsx - El banner/contador de la decisión
// de trampa reactiva (ficha 4) distingue rol (decide/espera) y cuenta atrás; inerte sin pausa.
import { render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IPendingReactiveTrapDecision } from "@/core/use-cases/game-engine/state/types";
import { ReactiveTrapDecisionTimer } from "./ReactiveTrapDecisionTimer";

function pendingFor(defenderPlayerId: string): IPendingReactiveTrapDecision {
  return {
    defenderPlayerId,
    attackerPlayerId: "atk",
    attackerInstanceId: "a1",
    isDirectAttack: true,
    eligibleTrapInstanceIds: ["t1", "t2"],
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ReactiveTrapDecisionTimer (ficha 4)", () => {
  it("sin pausa no renderiza nada", () => {
    const { container } = render(<ReactiveTrapDecisionTimer pending={null} localPlayerId="me" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("DEFENSOR (la pausa le apunta): muestra 'Elige tu trampa reactiva' y arranca en 15", () => {
    render(<ReactiveTrapDecisionTimer pending={pendingFor("me")} localPlayerId="me" />);
    expect(screen.getByText("Elige tu trampa reactiva")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
  });

  it("ATACANTE (la pausa apunta al rival): muestra 'Esperando la decisión del rival'", () => {
    render(<ReactiveTrapDecisionTimer pending={pendingFor("rival")} localPlayerId="me" />);
    expect(screen.getByText("Esperando la decisión del rival")).toBeTruthy();
  });

  it("la cuenta atrás decrementa con el tiempo", () => {
    vi.useFakeTimers();
    render(<ReactiveTrapDecisionTimer pending={pendingFor("me")} localPlayerId="me" />);
    expect(screen.getByText("15")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("12")).toBeTruthy();
  });
});
