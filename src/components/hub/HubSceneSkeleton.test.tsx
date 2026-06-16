// src/components/hub/HubSceneSkeleton.test.tsx - Verifica que el skeleton del hub muestra el mensaje de carga.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HubSceneSkeleton } from "./HubSceneSkeleton";

describe("HubSceneSkeleton", () => {
  it("renderiza el mensaje de carga", () => {
    render(<HubSceneSkeleton />);
    expect(screen.getByText("Cargando hub...")).toBeInTheDocument();
  });
});
