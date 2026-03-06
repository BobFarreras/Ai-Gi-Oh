// src/components/hub/HubScene.fallback.test.tsx - Valida que HubScene usa fallback 2D y permite navegación cuando se fuerza modo sin WebGL.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HubScene } from "./HubScene";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("HubScene fallback", () => {
  it("renderiza nodos 2D navegables cuando se fuerza fallback", () => {
    render(
      <HubScene
        forceFallbackForTests
        sections={[{ id: "home", type: "HOME", title: "Arsenal", description: "Gestiona mazos.", href: "/hub/home", isLocked: false, lockReason: null }]}
        nodes={[{ id: "n1", sectionType: "HOME", districtLabel: "Distrito", positionX: 50, positionY: 50 }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Abrir Arsenal" }));
    expect(push).toHaveBeenCalledWith("/hub/home");
  });
});
