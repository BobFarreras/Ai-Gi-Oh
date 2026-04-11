// src/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction.test.tsx - Verifica completado rápido tutorial y ocultación del botón tras éxito.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TutorialQuickCompleteAction } from "@/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction";

const postTutorialNodeCompletionMock = vi.fn();
const postTutorialCombatRewardClaimMock = vi.fn();
const postTutorialRewardClaimMock = vi.fn();
const markTutorialSoundtrackFirstRunFinishedMock = vi.fn();

vi.mock("@/services/tutorial/tutorial-node-progress-client", () => ({
  postTutorialNodeCompletion: (nodeId: string) => postTutorialNodeCompletionMock(nodeId),
  postTutorialCombatRewardClaim: () => postTutorialCombatRewardClaimMock(),
  postTutorialRewardClaim: () => postTutorialRewardClaimMock(),
}));

vi.mock("@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session", () => ({
  markTutorialSoundtrackFirstRunFinished: () => markTutorialSoundtrackFirstRunFinishedMock(),
}));

describe("TutorialQuickCompleteAction", () => {
  beforeEach(() => {
    postTutorialNodeCompletionMock.mockReset();
    postTutorialCombatRewardClaimMock.mockReset();
    postTutorialRewardClaimMock.mockReset();
    markTutorialSoundtrackFirstRunFinishedMock.mockReset();
    postTutorialNodeCompletionMock.mockResolvedValue({ nodeId: "ok" });
    postTutorialCombatRewardClaimMock.mockResolvedValue({ applied: true, rewardCardId: "exec-fusion-gemgpt" });
    postTutorialRewardClaimMock.mockResolvedValue({ applied: true, rewardKind: "NEXUS", rewardNexus: 600 });
  });

  it("oculta botón tras completar tutorial y aplicar recompensa", async () => {
    render(<TutorialQuickCompleteAction isAlreadyCompleted={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Completar tutorial \+ recompensa/i }));
    await waitFor(() => expect(screen.queryByRole("button", { name: /Completar tutorial \+ recompensa/i })).not.toBeInTheDocument());
    expect(postTutorialNodeCompletionMock).toHaveBeenCalledTimes(3);
    expect(postTutorialRewardClaimMock).toHaveBeenCalledTimes(1);
    expect(markTutorialSoundtrackFirstRunFinishedMock).toHaveBeenCalledTimes(1);
  });

  it("no renderiza botón cuando tutorial ya estaba completado", () => {
    render(<TutorialQuickCompleteAction isAlreadyCompleted />);
    expect(screen.queryByRole("button", { name: /Completar tutorial \+ recompensa/i })).not.toBeInTheDocument();
  });
});
