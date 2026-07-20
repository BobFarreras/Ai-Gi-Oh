// src/components/hub/HubProgressSection.test.tsx - Verifica navegación de los recuadros del badge y su gateo por tutorial.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { HubProgressSection } from "./HubProgressSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

const pushMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const HUD_STATS_RESPONSE = { eloRating: 1200, nexus: 500, collectionCount: 12 };

const COMPLETED: IPlayerHubProgress = {
  playerId: "p1",
  medals: 3,
  storyChapter: 2,
  hasCompletedTutorial: true,
  hasSeenAcademyIntro: true,
  hasSkippedTutorial: false,
};

const PRE_TOUR: IPlayerHubProgress = {
  playerId: "p1",
  medals: 0,
  storyChapter: 1,
  hasCompletedTutorial: false,
  hasSeenAcademyIntro: false,
  hasSkippedTutorial: false,
};

beforeEach(() => {
  pushMock.mockClear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(HUD_STATS_RESPONSE) });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HubProgressSection", () => {
  it("navega a la Arena al pulsar Medallas y reproduce el sonido del HUD", () => {
    const onToggleSound = vi.fn();
    render(<HubProgressSection progress={COMPLETED} onToggleSound={onToggleSound} />);

    fireEvent.click(screen.getByRole("button", { name: "Ir a la Arena" }));

    expect(pushMock).toHaveBeenCalledWith("/hub/academy/training/arena");
    expect(onToggleSound).toHaveBeenCalledTimes(1);
  });

  it("navega a Historia cuando el tutorial ya está completado", () => {
    render(<HubProgressSection progress={COMPLETED} />);

    fireEvent.click(screen.getByRole("button", { name: "Ir a Historia" }));

    expect(pushMock).toHaveBeenCalledWith("/hub/story");
  });

  it("mantiene Academy accesible aunque el tutorial esté pendiente", async () => {
    render(<HubProgressSection progress={PRE_TOUR} />);

    // Tutorial ahora está en la segunda fila: expandir "Ver más" primero.
    fireEvent.click(screen.getByRole("button", { name: "Ver más estadísticas" }));
    // Stats se cargan async: esperar a que aparezca el botón de Academy.
    const academyBtn = await screen.findByRole("button", { name: "Ir a Academy" });
    fireEvent.click(academyBtn);

    expect(pushMock).toHaveBeenCalledWith("/hub/academy");
  });

  it("bloquea Historia mientras el gate del tutorial sigue activo", () => {
    render(<HubProgressSection progress={PRE_TOUR} />);

    const story = screen.getByRole("button", { name: /Ir a Historia.*bloqueado/ });
    expect(story).toBeDisabled();

    fireEvent.click(story);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
