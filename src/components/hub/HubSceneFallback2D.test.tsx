// src/components/hub/HubSceneFallback2D.test.tsx - Verifica navegación y bloqueo del fallback 2D del hub.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { HubSceneFallback2D } from "./HubSceneFallback2D";

const SECTIONS: IHubSection[] = [
  { id: "home", type: "HOME", title: "Arsenal", description: "Gestiona mazos y perfil.", href: "/hub/home", isLocked: false, lockReason: null },
  {
    id: "story",
    type: "STORY",
    title: "Historia",
    description: "Progresa por capítulos.",
    href: "/hub/story",
    isLocked: true,
    lockReason: "Completa el entrenamiento para desbloquear historia.",
  },
];

const NODES: IHubMapNode[] = [
  { id: "home-node", sectionType: "HOME", districtLabel: "Distrito Base", positionX: 70, positionY: 70 },
  { id: "story-node", sectionType: "STORY", districtLabel: "Archivo", positionX: 50, positionY: 30 },
];

describe("HubSceneFallback2D", () => {
  it("navega al hacer click en sección desbloqueada", () => {
    const onNavigate = vi.fn();
    render(<HubSceneFallback2D sections={SECTIONS} nodes={NODES} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir Arsenal" }));
    expect(onNavigate).toHaveBeenCalledWith("/hub/home");
  });

  it("muestra lockReason al interactuar con sección bloqueada", () => {
    const onNavigate = vi.fn();
    render(<HubSceneFallback2D sections={SECTIONS} nodes={NODES} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar bloqueo de Historia" }));
    expect(screen.getByText("Completa el entrenamiento para desbloquear historia.")).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
