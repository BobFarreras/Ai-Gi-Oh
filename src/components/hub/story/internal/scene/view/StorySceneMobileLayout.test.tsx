// src/components/hub/story/internal/scene/view/StorySceneMobileLayout.test.tsx - Verifica barra inferior móvil de Story y apertura del panel de detalle.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StorySceneMobileLayout } from "./StorySceneMobileLayout";
import { IStorySceneMapViewProps, IStorySceneSidebarViewProps } from "./story-scene-view-props";

vi.mock("@/components/hub/story/internal/scene/view/StorySceneMapPane", () => ({
  StorySceneMapPane: () => <div data-testid="story-map-pane" />,
}));

vi.mock("@/components/hub/story/internal/scene/view/StoryMobileSidebarSheet", () => ({
  StoryMobileSidebarSheet: ({ isOpen }: { isOpen: boolean }) => <div>{isOpen ? "sheet-open" : "sheet-closed"}</div>,
}));

const baseSidebar: IStorySceneSidebarViewProps = {
  briefing: { chapter: 1, arcTitle: "Acto 1", objective: "Objetivo", tension: "Media" },
  selectedNode: null,
  isBusy: false,
  movementError: null,
  interactionFeedback: null,
  smartActionLabel: "Mover",
  canRunSmartAction: true,
  onExitToHub: () => undefined,
  onSmartAction: () => undefined,
  onDeselect: () => undefined,
};

const baseMap: IStorySceneMapViewProps = {
  nodes: [],
  currentNodeId: null,
  selectedNodeId: null,
  avatarVisualTarget: null,
  duelFocusNodeId: null,
  floatingReward: null,
  collectingRewardNodeId: null,
  collectingRewardVisual: null,
  retreatingNodeId: null,
  isBusy: false,
  smartActionLabel: "Interactuar con nodo",
  canRunSmartAction: true,
  canMoveSelectedNode: true,
  actTransitionTargetId: null,
  onSelectNode: () => undefined,
  onMoveSelectedNode: () => undefined,
  onRewardCollectAnimationComplete: () => undefined,
  onRetreatAnimationComplete: () => undefined,
  dialog: { isOpen: false, title: "", cinematicVideo: null, line: null, onNext: () => undefined, onClose: () => undefined },
  submission: {
    isOpen: false,
    title: "",
    hint: "",
    placeholder: "",
    activationLabel: "",
    generatedCode: "",
    requiredKeys: [],
    onCancel: () => undefined,
    onSubmit: () => undefined,
  },
};

describe("StorySceneMobileLayout", () => {
  it("elimina botón táctico duplicado, mantiene CTA dinámico y detalle funcional", () => {
    const sidebarWithDuel = {
      ...baseSidebar,
      selectedNode: {
        id: "story-duel-1",
        chapter: 1,
        duelIndex: 1,
        title: "Duelo 1",
        opponentName: "Rival",
        nodeType: "DUEL" as const,
        difficulty: "STANDARD" as const,
        rewardNexus: 0,
        rewardPlayerExperience: 0,
        isBossDuel: false,
        isCompleted: false,
        isUnlocked: true,
        href: "/hub/story/chapter/1/duel/1",
      },
    };
    render(<StorySceneMobileLayout sidebar={sidebarWithDuel} map={baseMap} />);
    expect(screen.queryByRole("button", { name: "Abrir detalle táctico" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Centrar en el jugador" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Interactuar con nodo" })).toBeInTheDocument();
    expect(screen.getByText("sheet-closed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir detalle del nodo" }));
    expect(screen.getByText("sheet-open")).toBeInTheDocument();
  });

  it("deshabilita detalle en plataforma MOVE sin contenido", () => {
    const sidebarWithMove = {
      ...baseSidebar,
      selectedNode: {
        id: "story-move-1",
        chapter: 1,
        duelIndex: 0,
        title: "Plataforma",
        opponentName: "",
        nodeType: "MOVE" as const,
        difficulty: "STANDARD" as const,
        rewardNexus: 0,
        rewardPlayerExperience: 0,
        isBossDuel: false,
        isCompleted: false,
        isUnlocked: true,
        href: "#",
      },
    };
    render(<StorySceneMobileLayout sidebar={sidebarWithMove} map={baseMap} />);
    expect(screen.getByRole("button", { name: "Abrir detalle del nodo" })).toBeDisabled();
  });

  it("reemplaza detalle por siguiente cuando el diálogo está abierto", () => {
    const onNext = vi.fn();
    render(
      <StorySceneMobileLayout
        sidebar={baseSidebar}
        map={{
          ...baseMap,
          dialog: {
            ...baseMap.dialog,
            isOpen: true,
            line: { speaker: "Sistema", text: "Línea activa", side: "LEFT" },
            onNext,
          },
        }}
      />,
    );

    const nextButton = screen.getByRole("button", { name: "Siguiente" });
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
