// src/components/hub/sections/HubSectionScreen.test.tsx - Verifica el render base de módulo disponible y bloqueado del hub.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HubSectionScreen } from "./HubSectionScreen";

describe("HubSectionScreen", () => {
  it("muestra estado disponible cuando la sección está desbloqueada", () => {
    render(<HubSectionScreen title="Mercado" description="Compra cartas." isLocked={false} lockReason={null} />);

    expect(screen.getByText("Sección disponible")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a sala de control" })).toBeInTheDocument();
  });

  it("muestra estado bloqueado cuando la sección no está desbloqueada", () => {
    render(
      <HubSectionScreen
        title="Multijugador"
        description="Arena online."
        isLocked={true}
        lockReason="Consigue una medalla para desbloquear."
      />,
    );

    expect(screen.getByText("Sección bloqueada")).toBeInTheDocument();
    expect(screen.getByText("Consigue una medalla para desbloquear.")).toBeInTheDocument();
  });
});
