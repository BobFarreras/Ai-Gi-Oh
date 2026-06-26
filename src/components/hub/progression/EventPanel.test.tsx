// src/components/hub/progression/EventPanel.test.tsx - Verifica que el diálogo del evento muestra los retos (misiones del evento) en "Cómo ganar", no solo las reglas por acción.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventPanel } from "./EventPanel";
import { IEventOverview } from "@/core/entities/progression/IEvent";
import { IMissionView } from "@/core/entities/progression/IMission";

const overview: IEventOverview = {
  eventId: "evt-launch",
  name: "Evento de Lanzamiento",
  description: null,
  currencyName: "Fragmentos",
  bannerUrl: null,
  endsAt: new Date(Date.now() + 86_400_000).toISOString(),
  points: 0,
  spentPoints: 0,
  balance: 0,
  earnRules: [],
  items: [],
};

const eventMissions: IMissionView[] = [
  {
    missionId: "evt-launch-elite",
    scope: "EVENT",
    objectiveType: "OWN_CARDS_AT_LEVEL",
    title: "Élite: 3 cartas a nivel 10",
    description: null,
    targetCount: 3,
    rewardNexus: 500,
    rewardType: "EVENT_POINTS",
    rewardCurrency: "Fragmentos",
    eventId: "evt-launch",
    periodKey: "evt-launch",
    progress: 1,
    completed: false,
    claimed: false,
  },
];

describe("EventPanel", () => {
  it("muestra los retos del evento en 'Cómo ganar' aunque no haya reglas por acción", () => {
    render(<EventPanel overview={overview} eventMissions={eventMissions} onClose={vi.fn()} />);

    // El bloque existe pese a earnRules vacío, porque hay retos.
    fireEvent.click(screen.getByRole("button", { name: /Cómo ganar Fragmentos/i }));

    expect(screen.getByText("Élite: 3 cartas a nivel 10")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText(/\+500/)).toBeInTheDocument();
  });

  it("no muestra el bloque 'Cómo ganar' si no hay reglas ni retos", () => {
    render(<EventPanel overview={overview} eventMissions={[]} onClose={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /Cómo ganar/i })).not.toBeInTheDocument();
  });
});
