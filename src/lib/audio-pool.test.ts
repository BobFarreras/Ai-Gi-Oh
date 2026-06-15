// src/lib/audio-pool.test.ts - Tests del pool lazy de instancias Audio.
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPlay = vi.fn(() => Promise.resolve());
const mockPause = vi.fn();

const originalAudio = globalThis.Audio;

class MockAudio {
  src = "";
  currentTime = 0;
  volume = 1;
  loop = false;
  preload = "auto";
  onended: (() => void) | null = null;
  constructor(src: string) {
    this.src = src;
  }
  play() {
    return mockPlay();
  }
  pause() {
    mockPause();
  }
}

beforeEach(() => {
  vi.resetModules();
  mockPlay.mockClear();
  mockPause.mockClear();
  // @ts-expect-error — mock global Audio
  globalThis.Audio = MockAudio;
  // Importar fresco para que use el mock
});

afterEach(() => {
  globalThis.Audio = originalAudio;
});

describe("audio-pool", () => {
  it("crea instancia Audio lazy con preload none y volumen configurado", async () => {
    const { getAudio } = await import("./audio-pool");
    const audio = getAudio("/audio/test.m4a", 0.5);
    expect(audio).not.toBeNull();
    expect(audio!.preload).toBe("none");
    expect(audio!.volume).toBeCloseTo(0.5);
  });

  it("reutiliza instancia cacheada en llamadas posteriores", async () => {
    const { getAudio, clearAudioPool } = await import("./audio-pool");
    clearAudioPool();
    const a1 = getAudio("/audio/test.m4a", 0.5);
    const a2 = getAudio("/audio/test.m4a", 0.5);
    expect(a1).toBe(a2);
  });

  it("crea instancias distintas para rutas distintas", async () => {
    const { getAudio } = await import("./audio-pool");
    const a1 = getAudio("/audio/a.m4a", 0.5);
    const a2 = getAudio("/audio/b.m4a", 0.5);
    expect(a1).not.toBe(a2);
  });

  it("playAudio invoca play en la instancia", async () => {
    const { playAudio } = await import("./audio-pool");
    playAudio("/audio/test.m4a", 0.3);
    expect(mockPlay).toHaveBeenCalled();
  });

  it("pauseAllAudio pausa todas las instancias del pool", async () => {
    const { getAudio, pauseAllAudio } = await import("./audio-pool");
    getAudio("/audio/a.m4a", 0.5);
    getAudio("/audio/b.m4a", 0.5);
    pauseAllAudio();
    expect(mockPause).toHaveBeenCalledTimes(2);
  });

  it("clearAudioPool vacía el pool y permite nuevas instancias", async () => {
    const { getAudio, clearAudioPool } = await import("./audio-pool");
    getAudio("/audio/a.m4a", 0.5);
    clearAudioPool();
    // Después de clear, nueva llamada crea instancia fresca.
    const audio = getAudio("/audio/a.m4a", 0.5);
    expect(audio).not.toBeNull();
  });
});