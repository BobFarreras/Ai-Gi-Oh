// src/app/hub/tutorial/arsenal/TutorialArsenalClient.test.tsx - Verifica flujo guiado base del nodo Preparar Deck con el motor reusable.
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TutorialArsenalClient } from "@/app/hub/tutorial/arsenal/TutorialArsenalClient";

describe("TutorialArsenalClient", () => {
  it("avanza por acciones hasta habilitar siguiente en el último paso", () => {
    render(<TutorialArsenalClient />);
    expect(screen.getByText("Selecciona una carta")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir detalle" }));
    expect(screen.getByText("Añadir al deck")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Añadir al Deck" }));
    expect(screen.getByText("Abrir evolución")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente paso del tutorial" })).toBeEnabled();
  });
});
