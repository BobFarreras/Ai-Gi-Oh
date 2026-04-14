// src/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction.test.tsx - Verifica completado rápido tutorial y ocultación del botón tras éxito.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TutorialQuickCompleteAction } from "@/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction";

const postTutorialNodeCompletionMock = vi.fn();
const postTutorialCombatRewardClaimMock = vi.fn();
const postTutorialRewardClaimMock = vi.fn();
const markTutorialSoundtrackFirstRunFinishedMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/services/tutorial/tutorial-node-progress-client", () => ({
  postTutorialNodeCompletion: (nodeId: string) => postTutorialNodeCompletionMock(nodeId),
  postTutorialCombatRewardClaim: () => postTutorialCombatRewardClaimMock(),
  postTutorialRewardClaim: () => postTutorialRewardClaimMock(),
}));

vi.mock("@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session", () => ({
  markTutorialSoundtrackFirstRunFinished: () => markTutorialSoundtrackFirstRunFinishedMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("TutorialQuickCompleteAction", () => {
  beforeEach(() => {
    postTutorialNodeCompletionMock.mockReset();
    postTutorialCombatRewardClaimMock.mockReset();
    postTutorialRewardClaimMock.mockReset();
    markTutorialSoundtrackFirstRunFinishedMock.mockReset();
    refreshMock.mockReset();
    postTutorialNodeCompletionMock.mockResolvedValue({ nodeId: "ok" });
    postTutorialCombatRewardClaimMock.mockResolvedValue({ applied: true, rewardCardId: "exec-fusion-gemgpt" });
    postTutorialRewardClaimMock.mockResolvedValue({ applied: true, rewardKind: "NEXUS", rewardNexus: 600 });
    vi.stubGlobal("Audio", class {
      volume = 0;
      play(): Promise<void> {
        return Promise.resolve();
      }
    });
  });

  it("muestra diálogo de recompensa y refresca al completar guardado rápido", async () => {
    render(<TutorialQuickCompleteAction isAlreadyCompleted={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Completar tutorial \+ recompensa/i }));
    fireEvent.click(screen.getByRole("button", { name: /Almacenar recompensa/i }));
    await waitFor(() => expect(postTutorialRewardClaimMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Completar tutorial \+ recompensa/i })).not.toBeInTheDocument());
    expect(postTutorialNodeCompletionMock).toHaveBeenCalledTimes(3);
    expect(markTutorialSoundtrackFirstRunFinishedMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));
  });

  it("no renderiza botón cuando tutorial ya estaba completado", () => {
    render(<TutorialQuickCompleteAction isAlreadyCompleted />);
    expect(screen.queryByRole("button", { name: /Completar tutorial \+ recompensa/i })).not.toBeInTheDocument();
  });

  it("notifica apertura del modo rápido al pulsar completar tutorial", () => {
    const onOpenQuickComplete = vi.fn();
    render(<TutorialQuickCompleteAction isAlreadyCompleted={false} onOpenQuickComplete={onOpenQuickComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /Completar tutorial \+ recompensa/i }));
    expect(onOpenQuickComplete).toHaveBeenCalledTimes(1);
  });
});
