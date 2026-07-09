// src/components/game/card/internal/CardHologramLiteStats.test.tsx - Tests de la columna de atributos flotante del holograma lite (móvil).
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CardHologramLiteStats } from "./CardHologramLiteStats";
import { ICard } from "@/core/entities/ICard";

const baseCard: ICard = {
  id: "test-card-lite",
  name: "Gemini 1.5 Pro",
  description: "Modelo de Google",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 7,
  attack: 2500,
  defense: 2000,
  archetype: "LLM",
  renderUrl: "/assets/renders/gemini.webp",
};

describe("CardHologramLiteStats", () => {
  it("muestra coste, ataque y defensa (lectura flotante de combate en móvil)", () => {
    render(<CardHologramLiteStats card={baseCard} isExecution={false} />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2500")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();
  });

  it("en ejecuciones oculta ATK/DEF y solo muestra el coste", () => {
    render(<CardHologramLiteStats card={{ ...baseCard, type: "EXECUTION" }} isExecution />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.queryByText("2500")).not.toBeInTheDocument();
    expect(screen.queryByText("2000")).not.toBeInTheDocument();
  });
});
