// src/components/game/board/ui/overlays/internal/FusionMaterialBrowser.test.tsx - Valida render y selección en el overlay de materiales de fusión.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { FusionMaterialBrowser, IFusionMaterialCandidate } from "./FusionMaterialBrowser";

function createCard(id: string, name: string): ICard {
  return {
    id,
    name,
    description: "Carta de prueba",
    type: "ENTITY",
    faction: "BIG_TECH",
    cost: 3,
    attack: 1200,
    defense: 1000,
    archetype: "LLM",
    renderUrl: "/assets/renders/python.png",
  };
}

describe("FusionMaterialBrowser", () => {
  it("permite seleccionar un material disponible y muestra progreso", () => {
    const onSelectMaterial = vi.fn();
    const candidates: IFusionMaterialCandidate[] = [
      { instanceId: "m1", card: createCard("c1", "Python"), mode: "ATTACK", isSelected: false, isSelectable: true },
      { instanceId: "m2", card: createCard("c2", "Postgres"), mode: "DEFENSE", isSelected: true, isSelectable: true },
    ];

    render(
      <FusionMaterialBrowser
        isOpen={true}
        candidates={candidates}
        selectedCount={1}
        onSelectMaterial={onSelectMaterial}
      />,
    );

    expect(screen.getByText("Selecciona 2 materiales (1/2)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Material Python" }));
    expect(onSelectMaterial).toHaveBeenCalledWith("m1");
  });
});
