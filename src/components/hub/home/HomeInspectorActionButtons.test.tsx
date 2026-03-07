// src/components/hub/home/HomeInspectorActionButtons.test.tsx - Valida visibilidad contextual de acciones mobile en el inspector de Arsenal.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeInspectorActionButtons } from "@/components/hub/home/HomeInspectorActionButtons";

describe("HomeInspectorActionButtons", () => {
  it("oculta evolución cuando la carta viene del deck", () => {
    render(
      <HomeInspectorActionButtons
        source="DECK"
        canInsert={false}
        canRemove
        canEvolve
        evolveCost={4}
        pendingAction={null}
        onInsert={vi.fn()}
        onRemove={vi.fn()}
        onEvolve={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Remover carta del deck" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Evolucionar carta seleccionada" })).not.toBeInTheDocument();
  });

  it("muestra añadir y evolución cuando la carta viene del almacén", () => {
    const onInsert = vi.fn();
    const onEvolve = vi.fn();
    render(
      <HomeInspectorActionButtons
        source="COLLECTION"
        canInsert
        canRemove={false}
        canEvolve
        evolveCost={4}
        pendingAction={null}
        onInsert={onInsert}
        onRemove={vi.fn()}
        onEvolve={onEvolve}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Añadir carta al deck" }));
    fireEvent.click(screen.getByRole("button", { name: "Evolucionar carta seleccionada" }));
    expect(onInsert).toHaveBeenCalledOnce();
    expect(onEvolve).toHaveBeenCalledOnce();
  });

  it("deshabilita acciones mientras hay operación en curso", () => {
    render(
      <HomeInspectorActionButtons
        source="COLLECTION"
        canInsert
        canRemove={false}
        canEvolve
        evolveCost={4}
        pendingAction="INSERT"
        onInsert={vi.fn()}
        onRemove={vi.fn()}
        onEvolve={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Añadir carta al deck" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Evolucionar carta seleccionada" })).toBeDisabled();
    expect(screen.getByText("Añadiendo...")).toBeInTheDocument();
  });
});
