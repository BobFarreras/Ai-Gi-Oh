// src/components/hub/academy/tutorial/nodes/reward/TutorialRewardClient.test.tsx - Tests de la página de recompensa final del tutorial.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TutorialRewardClient } from "./TutorialRewardClient";
import * as tutorialProgressClient from "@/services/tutorial/tutorial-node-progress-client";

vi.mock("@/services/tutorial/tutorial-node-progress-client", () => ({
  postTutorialRewardClaim: vi.fn(),
}));

describe("TutorialRewardClient", () => {
  it("muestra estado bloqueado y oculta botón de reclamar", () => {
    render(<TutorialRewardClient rewardNodeState="LOCKED" />);
    expect(screen.getByText("Recompensa bloqueada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bloqueado" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Reclamar recompensa" })).not.toBeInTheDocument();
  });

  it("muestra estado disponible y permite reclamar", async () => {
    vi.spyOn(tutorialProgressClient, "postTutorialRewardClaim").mockResolvedValue({
      applied: true,
      rewardKind: "NEXUS",
      rewardNexus: 600,
    });
    render(<TutorialRewardClient rewardNodeState="AVAILABLE" />);
    expect(screen.getByText("Recompensa disponible")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reclamar recompensa" }));
    expect(await screen.findByText("Recompensa aplicada: +600 Nexus.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reclamar recompensa" })).not.toBeInTheDocument();
  });

  it("muestra estado ya reclamado sin botón de reclamar", () => {
    render(<TutorialRewardClient rewardNodeState="COMPLETED" />);
    expect(screen.getByText("Recompensa reclamada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reclamar recompensa" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al mapa" })).toBeInTheDocument();
  });
});
