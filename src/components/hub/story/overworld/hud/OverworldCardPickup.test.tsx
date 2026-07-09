// src/components/hub/story/overworld/hud/OverworldCardPickup.test.tsx - Tests del overlay de revelado de carta al recogerla en el overworld.
import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverworldCardPickup } from "./OverworldCardPickup";
import { ICard } from "@/core/entities/ICard";

const rewardCard: ICard = {
  id: "trap-atk-drain",
  name: "Drenaje de Ataque",
  description: "Reduce el ataque enemigo",
  type: "TRAP",
  faction: "BIG_TECH",
  cost: 3,
  attack: 0,
  defense: 0,
  archetype: "SECURITY",
  renderUrl: "/assets/renders/traps/trap-atk-drain.webp",
};

describe("OverworldCardPickup", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("muestra la carta recogida a tamaño de lectura", () => {
    render(<OverworldCardPickup card={rewardCard} onComplete={vi.fn()} />);
    expect(screen.getByText("Drenaje de Ataque")).toBeInTheDocument();
  });

  it("llama a onComplete mediante el failsafe si la animación no dispara", () => {
    const onComplete = vi.fn();
    render(<OverworldCardPickup card={rewardCard} onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onComplete).toHaveBeenCalled();
  });
});
