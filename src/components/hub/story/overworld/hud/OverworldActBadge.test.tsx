// src/components/hub/story/overworld/hud/OverworldActBadge.test.tsx - Tests del badge de acto del overworld.
import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverworldActBadge } from "./OverworldActBadge";

describe("OverworldActBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it("muestra el acto y su nombre partiendo el título por '·'", () => {
    render(<OverworldActBadge mapId="act-3" arcTitle="Acto 3 · Repositorio Fantasma" />);
    expect(screen.getByText("Acto 3")).toBeInTheDocument();
    expect(screen.getByText("Repositorio Fantasma")).toBeInTheDocument();
  });

  it("se oculta tras la animación", () => {
    render(<OverworldActBadge mapId="act-3" arcTitle="Acto 3 · Repositorio Fantasma" />);
    expect(screen.getByText("Acto 3")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3500));
    expect(screen.queryByText("Acto 3")).not.toBeInTheDocument();
  });

  it("no reaparece en la misma sesión para el mismo acto (se retira al instante)", () => {
    const first = render(<OverworldActBadge mapId="act-3" arcTitle="Acto 3 · Repositorio Fantasma" />);
    expect(screen.getByText("Acto 3")).toBeInTheDocument();
    first.unmount();
    render(<OverworldActBadge mapId="act-3" arcTitle="Acto 3 · Repositorio Fantasma" />);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Acto 3")).not.toBeInTheDocument();
  });

  it("un acto distinto sí muestra su badge", () => {
    render(<OverworldActBadge mapId="act-3" arcTitle="Acto 3 · Repositorio Fantasma" />);
    render(<OverworldActBadge mapId="act-4" arcTitle="Acto 4 · Rascacielos de Silicio" />);
    expect(screen.getByText("Acto 4")).toBeInTheDocument();
  });
});
