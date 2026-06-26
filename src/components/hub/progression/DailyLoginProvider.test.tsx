// src/components/hub/progression/DailyLoginProvider.test.tsx - Verifica que reclamar en un consumidor (p. ej. el popup) actualiza a todos (p. ej. el badge del dock) vía estado compartido.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DailyLoginProvider, useDailyLogin } from "./DailyLoginProvider";
import { ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";

const status: ILoginStreakStatus = {
  currentStreak: 1,
  longestStreak: 1,
  claimedToday: false,
  pendingDayIndex: 1,
  calendar: [],
};

/** Consumidor que reclama (simula el popup Gate). */
function Claimer() {
  const { markClaimed } = useDailyLogin();
  return (
    <button type="button" onClick={() => markClaimed({ applied: true, alreadyClaimed: false, currentStreak: 2, dayIndex: 1, rewardType: "NEXUS", rewardNexus: 100, rewardCardId: null })}>
      Reclamar
    </button>
  );
}

/** Consumidor que muestra el estado (simula el badge del dock). */
function Badge() {
  const { status: shared } = useDailyLogin();
  return <span>{shared?.claimedToday ? "reclamado" : "pendiente"}</span>;
}

describe("DailyLoginProvider", () => {
  it("reclamar en un consumidor marca el día como reclamado para todos", () => {
    render(
      <DailyLoginProvider initialStatus={status}>
        <Claimer />
        <Badge />
      </DailyLoginProvider>,
    );

    expect(screen.getByText("pendiente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reclamar" }));
    expect(screen.getByText("reclamado")).toBeInTheDocument();
  });
});
