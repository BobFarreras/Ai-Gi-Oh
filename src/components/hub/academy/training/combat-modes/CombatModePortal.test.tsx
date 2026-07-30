// src/components/hub/academy/training/combat-modes/CombatModePortal.test.tsx - Verifica navegación y disponibilidad del portal.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CombatModePortal } from "./CombatModePortal";

describe("CombatModePortal", () => {
  it("permite entrar en Arena clásica desde su nueva ruta", () => {
    render(<CombatModePortal />);
    expect(screen.getByRole("link", { name: "Entrar en Arena clásica" })).toHaveAttribute(
      "href",
      "/hub/academy/training/arena/classic",
    );
  });

  it("presenta Supervivencia y Olimpo como modos todavía no disponibles", () => {
    render(<CombatModePortal />);
    expect(screen.getByRole("heading", { name: "Supervivencia" }).closest("article")).toHaveAttribute("data-availability", "unavailable");
    expect(screen.getByRole("heading", { name: "Olimpo" }).closest("article")).toHaveAttribute("data-availability", "unavailable");
    expect(screen.getAllByText("En preparación")).toHaveLength(2);
  });
});
