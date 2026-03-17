// src/components/hub/training/TrainingModeSelection.test.tsx - Pruebas de accesibilidad y navegación del selector de modos training.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingModeSelection } from "./TrainingModeSelection";

describe("TrainingModeSelection", () => {
  it("muestra las dos rutas de entrada de training", () => {
    render(<TrainingModeSelection />);
    expect(screen.getByRole("heading", { name: "Tutorial de Combate" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Modo Entrenamiento" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Empezar Tutorial" })).toHaveAttribute("href", "/hub/training/tutorial");
    expect(screen.getByRole("link", { name: "Ir a Entrenamiento" })).toHaveAttribute("href", "/hub/training/arena");
  });
});
