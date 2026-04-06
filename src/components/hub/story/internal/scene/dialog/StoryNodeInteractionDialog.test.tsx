// src/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog.test.tsx - Verifica secuencia manual, autoavance y overlay de vídeo narrativo Story.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoryNodeInteractionDialog } from "@/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog";

describe("StoryNodeInteractionDialog", () => {
  it("muestra botón flotante y permite avanzar manualmente", () => {
    const onNext = vi.fn();
    render(
      <StoryNodeInteractionDialog
        isOpen
        title="Evento de prueba"
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
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <StoryNodeInteractionDialog
        isOpen
        title="Evento con vídeo"
        cinematicVideo={{ videoUrl: "/assets/videos/story/act-1/intro-act-1.mp4", skipLabel: "Interrumpir vídeo" }}
        line={{ speaker: "BigLog", text: "Prueba de vídeo", side: "RIGHT" }}
        onNext={() => undefined}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText(/interrumpir vídeo/i));
    expect(onClose).toHaveBeenCalledTimes(0);
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
