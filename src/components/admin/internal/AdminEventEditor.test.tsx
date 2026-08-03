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
  // Este render monta el catálogo completo de objetivos y ronda los 3-4 s en frío; con la suite entera
  // en paralelo se comía los 5 s por defecto y tumbaba el gate sin que nada estuviera roto.
  it("muestra el sub-bloque de retos del evento con alta, borrado y objetivos de colección", { timeout: 15_000 }, () => {
    render(<AdminEventEditor event={event} />);

    expect(screen.getByText(/Retos \(una vez\)/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Añadir reto/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Eliminar reto/i })).toBeInTheDocument();

    // Las modalidades de colección están disponibles en el desplegable de objetivos del reto.
    expect(screen.getAllByRole("option", { name: /Tener cartas en el almacén/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("option", { name: /Tener cartas a nivel/i }).length).toBeGreaterThanOrEqual(1);
    // Hay una opción flawless por sección (story/training/multiplayer).
    expect(screen.getAllByRole("option", { name: /sin perder LP/i }).length).toBeGreaterThanOrEqual(3);
  });

  it("el selector de añadir reto ofrece todos los objetivos posibles del catálogo", () => {
    render(<AdminEventEditor event={event} />);

    const selector = screen.getByRole("combobox", { name: /Objetivo del nuevo reto/i });
    // Una opción por cada objetivo posible + el placeholder.
    expect(selector.querySelectorAll("option").length).toBe(MISSION_OBJECTIVE_TYPES.length + 1);
  });

  it("permite eliminar una regla de 'cómo se ganan puntos' con el icono de basura", () => {
    render(<AdminEventEditor event={event} />);

    expect(screen.getByRole("button", { name: /Eliminar regla Ganar un duelo/i })).toBeInTheDocument();
  });

  it("el selector de 'Añadir acción' ofrece acciones repetibles (incl. flawless) pero NO objetivos de colección", () => {
    render(<AdminEventEditor event={event} />);

    const actionSelector = screen.getByRole("combobox", { name: /Acción de la nueva regla de puntos/i });
    const labels = Array.from(actionSelector.querySelectorAll("option")).map((option) => option.textContent);
    // Las flawless sí pasan por el bus de acciones -> válidas como regla de puntos.
    expect(labels).toContain("Ganar en Story sin perder LP");
    // Los objetivos de colección (estado, con umbral) NO se otorgan por acción: solo en misiones.
    expect(labels).not.toContain("Tener cartas en el almacén");
    expect(labels).not.toContain("Tener cartas a nivel ≥");
    // WIN_DUEL ya está usado como regla, así que no debe reaparecer como opción.
    expect(labels).not.toContain("Ganar un duelo");
  });
});
