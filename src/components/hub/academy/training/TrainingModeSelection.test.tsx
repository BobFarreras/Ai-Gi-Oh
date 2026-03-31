// src/components/hub/academy/training/TrainingModeSelection.test.tsx - Pruebas de accesibilidad y navegación del selector de modos de Academia.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingModeSelection } from "./TrainingModeSelection";

describe("TrainingModeSelection", () => {
  it("muestra las dos rutas de entrada de training", () => {
    render(<TrainingModeSelection />);
    expect(screen.getByRole("heading", { name: "Módulo Tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Arena de Práctica" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Módulo Tutorial/i })).toHaveAttribute("href", "/hub/academy/tutorial");
    expect(screen.getByRole("link", { name: /Arena de Práctica/i })).toHaveAttribute("href", "/hub/academy/training/arena");
  });
});
