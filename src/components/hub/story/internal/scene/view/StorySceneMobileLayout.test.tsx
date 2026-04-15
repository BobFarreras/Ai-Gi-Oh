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
  it("elimina botón táctico duplicado y mantiene detalle funcional", () => {
    render(<StorySceneMobileLayout sidebar={baseSidebar} map={baseMap} />);
    expect(screen.queryByRole("button", { name: "Abrir detalle táctico" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Centrar en el jugador" })).not.toBeInTheDocument();
    expect(screen.getByText("sheet-closed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir detalle del nodo" }));
    expect(screen.getByText("sheet-open")).toBeInTheDocument();
  });
});

