// src/components/hub/HubScene.test.tsx - Verifica renderizado de nodos y estado bloqueado en la escena del hub.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HubScene } from "./HubScene";

describe("HubScene", () => {
  it("muestra distritos y CTA de entrada para secciones desbloqueadas", () => {
    render(
      <HubScene
        progress={{ playerId: "p1", medals: 2, storyChapter: 3, hasCompletedTutorial: true }}
        sections={[
          {
            id: "home",
            type: "HOME",
            title: "Mi Home",
            description: "Gestiona mazos y perfil.",
            href: "/hub/home",
            isLocked: false,
            lockReason: null,
          },
        ]}
        nodes={[{ id: "n1", sectionType: "HOME", positionX: 40, positionY: 52, districtLabel: "Distrito Base" }]}
      />,
    );

    expect(screen.getByText("Distrito Base")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Mi Home" })).toBeInTheDocument();
  });

  it("muestra motivo de bloqueo cuando la sección está cerrada", () => {
    render(
      <HubScene
        progress={{ playerId: "p1", medals: 0, storyChapter: 1, hasCompletedTutorial: false }}
        sections={[
          {
            id: "multi",
            type: "MULTIPLAYER",
            title: "Multijugador",
            description: "Arena online.",
            href: "/hub/multiplayer",
            isLocked: true,
            lockReason: "Consigue al menos 1 medalla para desbloquear multijugador.",
          },
        ]}
        nodes={[{ id: "n2", sectionType: "MULTIPLAYER", positionX: 65, positionY: 28, districtLabel: "Portal Arena" }]}
      />,
    );

    expect(screen.queryByText(/Consigue al menos 1 medalla/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar bloqueo de Multijugador" }));
    expect(screen.getByText(/Consigue al menos 1 medalla/i)).toBeInTheDocument();
  });
});
