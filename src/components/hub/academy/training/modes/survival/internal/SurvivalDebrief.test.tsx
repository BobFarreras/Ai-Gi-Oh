// src/components/hub/academy/training/modes/survival/internal/SurvivalDebrief.test.tsx - Verifica resumen, hito y acciones de la expedición.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ISurvivalSettlement } from "../survival-api-client";
import { SurvivalDebrief } from "./SurvivalDebrief";

const settlement = {
  run: { status: "ACTIVE", wins: 5, currentLp: 6100, maxLp: 8000 },
  progress: { bestWins: 8, ascensionFragments: 130 },
  battle: { milestoneHeal: 2000 },
  reward: { ascensionFragments: 31, definitionId: "boss", milestoneReached: true },
  outcome: "WIN",
  duplicate: false,
} as ISurvivalSettlement;

describe("SurvivalDebrief", () => {
  it("muestra recompensa, récord y permite avanzar tras una victoria", () => {
    const onContinue = vi.fn();
    render(<SurvivalDebrief
      settlement={settlement}
      isLoading={false}
      milestoneInterval={5}
      error={null}
      onContinue={onContinue}
      onExit={vi.fn()}
    />);

    expect(screen.getByText("Hito alcanzado · +2000 LP recuperados")).toBeInTheDocument();
    expect(screen.getByText("Saldo de Éter")).toBeInTheDocument();
    expect(screen.getByText("130")).toBeInTheDocument();
    expect(screen.getByText("+31")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente combate" }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it("cierra la run derrotada sin ofrecer otro combate", () => {
    render(<SurvivalDebrief
      settlement={{ ...settlement, run: { ...settlement.run, status: "COMPLETED_DEFEAT" } }}
      isLoading={false}
      milestoneInterval={5}
      error={null}
      onContinue={vi.fn()}
      onExit={vi.fn()}
    />);

    expect(screen.getByText("Expedición finalizada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente combate" })).not.toBeInTheDocument();
  });

  it("explica que un empate también termina la expedición", () => {
    render(<SurvivalDebrief
      settlement={{
        ...settlement,
        outcome: "DRAW",
        run: { ...settlement.run, status: "COMPLETED_DEFEAT" },
      }}
      isLoading={false}
      milestoneInterval={5}
      error={null}
      onContinue={vi.fn()}
      onExit={vi.fn()}
    />);

    expect(screen.getByText("Empate")).toBeInTheDocument();
    expect(screen.getByText("Un empate no permite avanzar: la expedición termina aquí.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente combate" })).not.toBeInTheDocument();
  });
});
