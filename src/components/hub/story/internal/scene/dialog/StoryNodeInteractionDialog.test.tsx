// src/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog.test.tsx - Verifica secuencia manual, autoavance y overlay de vídeo narrativo Story.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoryNodeInteractionDialog } from "@/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog";

describe("StoryNodeInteractionDialog", () => {
  it("muestra botón flotante y permite avanzar manualmente", () => {
    const onNext = vi.fn();
    render(
      <StoryNodeInteractionDialog
        isOpen
        title="Evento de prueba"
        soundtrackUrl={null}
        cinematicVideo={null}
        line={{ speaker: "GenNvim", text: "Mensaje de prueba", side: "RIGHT" }}
        onNext={onNext}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /siguiente diálogo/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("autoavanza cuando la línea define autoAdvanceMs", () => {
    vi.useFakeTimers();
    const onNext = vi.fn();
    render(
      <StoryNodeInteractionDialog
        isOpen
        title="Evento de prueba"
        soundtrackUrl={null}
        cinematicVideo={null}
        line={{ speaker: "Sistema", text: "Autoavance", side: "LEFT", autoAdvanceMs: 1000 }}
        onNext={onNext}
        onClose={() => undefined}
      />,
    );

    vi.advanceTimersByTime(1000);
    expect(onNext).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("permite interrumpir la cinemática full-screen", () => {
    const onClose = vi.fn();
    render(
      <StoryNodeInteractionDialog
        isOpen
        title="Evento con vídeo"
        soundtrackUrl={null}
        cinematicVideo={{ videoUrl: "/assets/videos/gemgpt.mp4", skipLabel: "Interrumpir vídeo" }}
        line={{ speaker: "BigLog", text: "Prueba de vídeo", side: "RIGHT" }}
        onNext={() => undefined}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText(/interrumpir vídeo/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
