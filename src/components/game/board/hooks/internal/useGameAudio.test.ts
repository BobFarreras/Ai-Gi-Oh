// src/components/game/board/hooks/internal/useGameAudio.test.ts - Verifica el reintento de soundtrack tras bloqueo de autoplay móvil.
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameAudio } from "./useGameAudio";
import { createAudioFromPath, safePlay } from "./audio/audioRuntime";

vi.mock("./audio/audioRuntime", () => ({
  createAudio: vi.fn(),
  createAudioFromPath: vi.fn(),
  mapEventToTrack: vi.fn(),
  safePlay: vi.fn(),
  safePlayWithFallback: vi.fn(),
}));

describe("useGameAudio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reintenta el soundtrack custom en el primer gesto si autoplay fue bloqueado", () => {
    const soundtrack = { pause: vi.fn(), currentTime: 0 } as unknown as HTMLAudioElement;
    vi.mocked(createAudioFromPath).mockReturnValue(soundtrack);
    renderHook(() => useGameAudio({
      combatLog: [],
      winnerPlayerId: null,
      playerId: "p1",
      isHistoryOpen: false,
      hasSelectedCard: false,
      lastErrorCode: null,
      isMuted: false,
      isPaused: false,
      customSoundtrackPath: "/audio/survival/pulso-de-neon.m4a",
    }));

    expect(createAudioFromPath).toHaveBeenCalledWith("/audio/survival/pulso-de-neon.m4a", 0.34, true);
    expect(safePlay).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event("pointerdown")));
    expect(safePlay).toHaveBeenCalledTimes(2);
  });
});
