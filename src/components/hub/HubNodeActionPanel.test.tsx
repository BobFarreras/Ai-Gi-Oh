// src/components/hub/HubNodeActionPanel.test.tsx - Verifica navegación y bloqueo accesible en el panel HTML de nodos 3D.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { HubNodeActionPanel } from "./HubNodeActionPanel";

function createSection(overrides?: Partial<IHubSection>): IHubSection {
  return {
    id: "home",
    type: "HOME",
    title: "Arsenal",
    description: "Gestiona mazos y perfil.",
    href: "/hub/home",
    isLocked: false,
    lockReason: null,
    ...overrides,
  };
}

describe("HubNodeActionPanel", () => {
  it("navega cuando la sección está desbloqueada", () => {
    const onAction = vi.fn();
    render(<HubNodeActionPanel section={createSection()} baseColor="#10b981" isHovered={false} isLockReasonVisible={false} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Arsenal" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("muestra lockReason cuando la sección está bloqueada", () => {
    const lockReason = "Completa el entrenamiento para desbloquear historia.";
    const onAction = vi.fn();
    const section = createSection({ id: "story", type: "STORY", title: "Historia", href: "/hub/story", isLocked: true, lockReason });
    const { rerender } = render(<HubNodeActionPanel section={section} baseColor="#0ea5e9" isHovered={false} isLockReasonVisible={false} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar bloqueo de Historia" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    rerender(<HubNodeActionPanel section={section} baseColor="#0ea5e9" isHovered={false} isLockReasonVisible onAction={onAction} />);
    expect(screen.getByText(lockReason)).toBeInTheDocument();
  });

  it("aplica color de borde en base al nodo", () => {
    const lockReason = "Completa el entrenamiento para desbloquear historia.";
    render(
      <HubNodeActionPanel
        section={createSection({ id: "story", type: "STORY", title: "Historia", href: "/hub/story", isLocked: true, lockReason })}
        baseColor="#0ea5e9"
        isHovered={false}
        isLockReasonVisible={false}
        onAction={vi.fn()}
      />,
    );
    const button = screen.getByRole("button", { name: "Mostrar bloqueo de Historia" });
    expect(button).toHaveStyle({ borderColor: "#0ea5e980" });
  });
});
