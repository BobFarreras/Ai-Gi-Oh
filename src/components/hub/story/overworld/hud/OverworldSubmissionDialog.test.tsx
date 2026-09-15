// src/components/hub/story/overworld/hud/OverworldSubmissionDialog.test.tsx - Tests del terminal de código del overworld: recuerda los fragmentos ya recogidos y oculta los que faltan.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverworldSubmissionDialog } from "./OverworldSubmissionDialog";
import { resolveStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";

const edgePrompt = resolveStoryNodeSubmissionPrompt("story-ch6-edge-terminal")!;
const firewallPrompt = resolveStoryNodeSubmissionPrompt("story-ch3-firewall-terminal")!;

function renderDialog(
  prompt = edgePrompt,
  collected: string[] = [],
  onSubmit = vi.fn(),
): { onSubmit: ReturnType<typeof vi.fn> } {
  render(
    <OverworldSubmissionDialog
      prompt={prompt}
      collectedNodeIds={new Set(collected)}
      errorText={null}
      onSubmit={onSubmit}
      onClose={vi.fn()}
    />,
  );
  return { onSubmit };
}

describe("OverworldSubmissionDialog", () => {
  it("enseña el fragmento de una llave ya recogida y tapa el de las que faltan", () => {
    renderDialog(edgePrompt, ["story-ch6-key-north"]);
    expect(screen.getByText("EDGE-40")).toBeInTheDocument();
    expect(screen.queryByText("21-88")).not.toBeInTheDocument();
    expect(screen.queryByText("30")).not.toBeInTheDocument();
  });

  it("no ofrece encadenar mientras falte alguna llave", () => {
    renderDialog(edgePrompt, ["story-ch6-key-north", "story-ch6-key-east"]);
    expect(screen.queryByRole("button", { name: /encadenar fragmentos/i })).not.toBeInTheDocument();
  });

  it("con las tres llaves, encadenar rellena el código completo del terminal", () => {
    const { onSubmit } = renderDialog(edgePrompt, [
      "story-ch6-key-north",
      "story-ch6-key-east",
      "story-ch6-key-south",
    ]);
    fireEvent.click(screen.getByRole("button", { name: /encadenar fragmentos/i }));
    expect(screen.getByLabelText("Código del terminal")).toHaveValue(edgePrompt.generatedCode);

    fireEvent.click(screen.getByRole("button", { name: edgePrompt.activationLabel }));
    expect(onSubmit).toHaveBeenCalledWith(edgePrompt.generatedCode);
  });

  it("no pinta el bloque de fragmentos en terminales de código único", () => {
    renderDialog(firewallPrompt, []);
    expect(screen.queryByText(/fragmentos recuperados/i)).not.toBeInTheDocument();
  });

  it("deja escribir el código a mano sin tocar los fragmentos", () => {
    const { onSubmit } = renderDialog(firewallPrompt, []);
    fireEvent.change(screen.getByLabelText("Código del terminal"), { target: { value: "PURGE-3F17" } });
    fireEvent.click(screen.getByRole("button", { name: firewallPrompt.activationLabel }));
    expect(onSubmit).toHaveBeenCalledWith("PURGE-3F17");
  });
});
