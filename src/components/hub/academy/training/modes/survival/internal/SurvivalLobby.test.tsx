// src/components/hub/academy/training/modes/survival/internal/SurvivalLobby.test.tsx - Verifica estado, accesibilidad y continuación de la expedición.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SurvivalLobby } from "./SurvivalLobby";

describe("SurvivalLobby", () => {
  it("muestra los LP transportados y permite continuar con un control accesible", () => {
    const onStart = vi.fn();
    render(<SurvivalLobby
      run={{
        id: "run-1", playerId: "p1", status: "ACTIVE", currentLp: 4300, maxLp: 8000,
        wins: 3, currentBattleIndex: 3, rulesetVersion: 1, startedAtIso: "2026-07-30",
        completedAtIso: null, version: 1,
      }}
      isLoading={false}
      error={null}
      onStart={onStart}
    />);

    expect(screen.getByText("4300 / 8000")).toBeInTheDocument();
    expect(screen.getByText("#4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar expedición" }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
