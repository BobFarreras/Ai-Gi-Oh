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

  it("en una conversación entre villanos no sale el jugador y cada uno mantiene su hueco fijo", () => {
    const GENNVIM = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";
    const MIDUTECH = "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp";
    // Línea de GenNvim, fijado ABAJO por `side: "LEFT"`; su interlocutor Midutech ocupa el hueco de arriba.
    const view = render(
      <StoryNodeInteractionDialog
        isOpen
        title="La Carta Suprema"
        cinematicVideo={null}
        line={{
          actorId: "opp-ch4-gennvim",
          speaker: "GenNvim",
          text: "Hemos podido crear la carta suprema.",
          side: "LEFT",
          portraitUrl: GENNVIM,
          counterpartPortraitUrl: MIDUTECH,
        }}
        onNext={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.queryByAltText(/retrato del jugador/i)).toBeNull();
    const bottomFirst = screen.getByAltText(/retrato de GenNvim/i).getAttribute("src");
    const topFirst = screen.getByAltText(/retrato del interlocutor/i).getAttribute("src");

    // Turno de Midutech (`side: "RIGHT"`, arriba): los retratos NO se intercambian, solo cambia quien habla.
    view.rerender(
      <StoryNodeInteractionDialog
        isOpen
        title="La Carta Suprema"
        cinematicVideo={null}
        line={{
          actorId: "opp-ch4-midutech",
          speaker: "Midutech",
          text: "Voy a llevármela.",
          side: "RIGHT",
          portraitUrl: MIDUTECH,
          counterpartPortraitUrl: GENNVIM,
        }}
        onNext={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.queryByAltText(/retrato del jugador/i)).toBeNull();
    expect(screen.getByAltText(/retrato del interlocutor/i).getAttribute("src")).toBe(bottomFirst);
    expect(screen.getByAltText(/retrato de Midutech/i).getAttribute("src")).toBe(topFirst);
  });

  it("sin interlocutor declarado, el hueco de abajo sigue siendo del jugador", () => {
    render(
      <StoryNodeInteractionDialog
        isOpen
        title="Guardián de la Hydra"
        cinematicVideo={null}
        line={{ actorId: "opp-ch4-gennvim", speaker: "GenNvim", text: "Ni un paso más.", side: "RIGHT" }}
        onNext={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByAltText(/retrato del jugador/i)).toBeInTheDocument();
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
