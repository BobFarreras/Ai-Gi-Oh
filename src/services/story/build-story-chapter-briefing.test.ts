// src/services/story/build-story-chapter-briefing.test.ts - Verifica briefing narrativo por capítulo y fallback para capítulos no definidos.
import { buildStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";

describe("buildStoryChapterBriefing", () => {
  it("resuelve briefing configurado para capítulo 1", () => {
    const briefing = buildStoryChapterBriefing(1);
    expect(briefing.arcTitle).toContain("Acto 1");
    expect(briefing.chapter).toBe(1);
  });

  it("usa fallback para capítulo no registrado", () => {
    const briefing = buildStoryChapterBriefing(9);
    expect(briefing.chapter).toBe(9);
    expect(briefing.arcTitle).toContain("Capítulo 9");
  });
});
