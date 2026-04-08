// src/services/story/resolve-story-act-soundtrack-url.test.ts - Verifica resolución del soundtrack global por acto Story.
import { describe, expect, it } from "vitest";
import { resolveStoryActSoundtrackUrl } from "@/services/story/resolve-story-act-soundtrack-url";

describe("resolveStoryActSoundtrackUrl", () => {
  it("resuelve pista del Acto 1", () => {
    expect(resolveStoryActSoundtrackUrl(1)).toContain("/audio/story/soundtracks/act-1/act-1-main-theme.mp3");
  });

  it("resuelve pista del Acto 5", () => {
    expect(resolveStoryActSoundtrackUrl(5)).toContain("/audio/story/soundtracks/act-5/act-5-main-theme.mp3");
  });

  it("resuelve pista del Acto 2", () => {
    expect(resolveStoryActSoundtrackUrl(2)).toContain("/audio/story/soundtracks/act-2/Chromed%20Horizon.mp3");
  });

  it("usa fallback al Acto 1 cuando no hay pista definida", () => {
    expect(resolveStoryActSoundtrackUrl(3)).toContain("/audio/story/soundtracks/act-1/act-1-main-theme.mp3");
  });
});
