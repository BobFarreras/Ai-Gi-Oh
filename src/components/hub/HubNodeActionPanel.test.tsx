// src/components/hub/HubNodeActionPanel.test.tsx - Verifica navegación y bloqueo accesible en el panel HTML de nodos 3D.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { HubNodeActionPanel } from "./HubNodeActionPanel";

function createSection(overrides?: Partial<IHubSection>): IHubSection {
  return {
    id: "home",
    type: "HOME",
    title: "Mi Home",
    description: "Gestiona mazos y perfil.",
    href: "/hub/home",
    isLocked: false,
    lockReason: null,
    ...overrides,
  };
}

describe("HubNodeActionPanel", () => {
  it("navega cuando la sección está desbloqueada", () => {
    const onNavigate = vi.fn();
    render(<HubNodeActionPanel section={createSection()} baseColor="#10b981" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Mi Home" }));
    expect(onNavigate).toHaveBeenCalledWith("/hub/home");
  });

  it("muestra lockReason cuando la sección está bloqueada", () => {
    const onNavigate = vi.fn();
    const lockReason = "Completa el entrenamiento para desbloquear historia.";
    render(
      <HubNodeActionPanel
        section={createSection({ id: "story", type: "STORY", title: "Historia", href: "/hub/story", isLocked: true, lockReason })}
        baseColor="#0ea5e9"
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mostrar bloqueo de Historia" }));
    expect(screen.getByText(lockReason)).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
