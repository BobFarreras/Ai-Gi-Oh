// src/components/hub/academy/training/TrainingModeSelection.test.tsx - Pruebas de accesibilidad y navegación del selector de modos de Academia.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrainingModeSelection } from "./TrainingModeSelection";

describe("TrainingModeSelection", () => {
  it("muestra las dos rutas de entrada de training", () => {
    render(<TrainingModeSelection />);
    expect(screen.getByRole("heading", { name: "Mapa de Tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Modo Entrenamiento" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Mapa Tutorial" })).toHaveAttribute("href", "/hub/academy/tutorial");
    expect(screen.getByRole("link", { name: "Ir a Entrenamiento" })).toHaveAttribute("href", "/hub/academy/training/arena");
  });
});
