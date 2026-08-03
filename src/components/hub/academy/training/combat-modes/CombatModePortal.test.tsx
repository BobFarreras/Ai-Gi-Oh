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

  it("habilita los tres modos ahora que Olimpo tiene runtime", () => {
    render(<CombatModePortal />);
    expect(screen.getByRole("link", { name: "Entrar en Supervivencia" })).toHaveAttribute(
      "href",
      "/hub/academy/training/arena/survival",
    );
    expect(screen.getByRole("link", { name: "Entrar en Olimpo" })).toHaveAttribute(
      "href",
      "/hub/academy/training/arena/olympus",
    );
    expect(screen.queryByText("En preparación")).not.toBeInTheDocument();
  });
});
