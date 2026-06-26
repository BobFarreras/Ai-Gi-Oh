// src/components/admin/internal/AdminEventEditor.test.tsx - Verifica que el editor de eventos muestra la sección de misiones del evento, con borrado y objetivos de colección.
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminEventEditor } from "./AdminEventEditor";
import { IAdminEvent } from "@/core/entities/progression/ILiveOpsAdmin";
import { MISSION_OBJECTIVE_TYPES } from "@/core/services/progression/action-labels";

const event: IAdminEvent = {
  id: "evt-launch",
  name: "Evento de Lanzamiento",
  description: "Demo",
  currencyName: "Fragmentos",
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 86_400_000).toISOString(),
  isActive: true,
  rules: [{ eventId: "evt-launch", actionType: "WIN_DUEL", pointsPer: 10 }],
  items: [],
  missions: [
    {
      id: "evt-launch-m1",
      scope: "EVENT",
      objectiveType: "OWN_CARDS_AT_LEVEL",
      objectiveParam: 10,
      targetCount: 3,
      rewardNexus: 100,
      rewardType: "EVENT_POINTS",
      eventId: "evt-launch",
      title: "Reto de colección",
      description: null,
      sortOrder: 1,
      isActive: true,
    },
  ],
};

describe("AdminEventEditor", () => {
  it("muestra la sección de misiones del evento con alta, borrado y objetivos de colección", () => {
    render(<AdminEventEditor event={event} />);

    expect(screen.getByText(/Misiones del evento/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Añadir misión/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Eliminar misión/i })).toBeInTheDocument();

    // Las nuevas modalidades de colección están disponibles en el desplegable de objetivos.
    expect(screen.getAllByRole("option", { name: /Tener cartas en el almacén/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("option", { name: /Tener cartas a nivel/i }).length).toBeGreaterThanOrEqual(1);
    // Hay una opción flawless por sección (story/training/multiplayer).
    expect(screen.getAllByRole("option", { name: /sin perder LP/i }).length).toBeGreaterThanOrEqual(3);
  });

  it("el selector de añadir misión ofrece todas las misiones posibles del catálogo", () => {
    render(<AdminEventEditor event={event} />);

    const selector = screen.getByRole("combobox", { name: /Objetivo de la nueva misión/i });
    // Una opción por cada objetivo posible + el placeholder.
    expect(selector.querySelectorAll("option").length).toBe(MISSION_OBJECTIVE_TYPES.length + 1);
  });

  it("permite eliminar una regla de 'cómo se ganan puntos' con el icono de basura", () => {
    render(<AdminEventEditor event={event} />);

    expect(screen.getByRole("button", { name: /Eliminar regla Ganar un duelo/i })).toBeInTheDocument();
  });
});
