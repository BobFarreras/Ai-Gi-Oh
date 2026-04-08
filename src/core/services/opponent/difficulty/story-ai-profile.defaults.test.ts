// src/core/services/opponent/difficulty/story-ai-profile.defaults.test.ts - Asegura progresión de estilos y agresividad por las 5 dificultades Story.
import { describe, expect, it } from "vitest";
import { normalizeStoryAiProfile, resolveDefaultStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";

describe("resolveDefaultStoryAiProfile", () => {
  it("asigna estilos esperados para cada dificultad Story", () => {
    expect(resolveDefaultStoryAiProfile("ROOKIE").style).toBe("control");
    expect(resolveDefaultStoryAiProfile("STANDARD").style).toBe("aggressive");
    expect(resolveDefaultStoryAiProfile("ELITE").style).toBe("combo");
    expect(resolveDefaultStoryAiProfile("BOSS").style).toBe("combo");
    expect(resolveDefaultStoryAiProfile("MYTHIC").style).toBe("combo");
  });

  it("incrementa agresividad de forma monotónica entre ROOKIE y MYTHIC", () => {
    const rookie = resolveDefaultStoryAiProfile("ROOKIE").aggression;
    const standard = resolveDefaultStoryAiProfile("STANDARD").aggression;
    const elite = resolveDefaultStoryAiProfile("ELITE").aggression;
    const boss = resolveDefaultStoryAiProfile("BOSS").aggression;
    const mythic = resolveDefaultStoryAiProfile("MYTHIC").aggression;

    expect(rookie).toBeLessThan(standard);
    expect(standard).toBeLessThan(elite);
    expect(elite).toBeLessThan(boss);
    expect(boss).toBeLessThan(mythic);
  });

  it("normaliza perfiles corruptos usando fallback del nivel indicado", () => {
    const profile = normalizeStoryAiProfile({ style: "invalid", aggression: "x" }, "BOSS");
    expect(profile.style).toBe("combo");
    expect(profile.aggression).toBe(resolveDefaultStoryAiProfile("BOSS").aggression);
  });
});
