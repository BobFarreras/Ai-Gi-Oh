// src/services/story/build-story-opponent-narration-pack.test.ts - Valida personalización de textos/audio/retratos narrativos por oponente Story.
import { buildStoryOpponentNarrationPack } from "./build-story-opponent-narration-pack";
import { describe, expect, it } from "vitest";
import { getStoryOpponentNarrationProfile } from "./story-opponent-narration-catalog";

describe("buildStoryOpponentNarrationPack", () => {
  it("aplica overrides del primer oponente de story", () => {
    const pack = buildStoryOpponentNarrationPack({
      opponentId: "opp-ch1-apprentice",
      opponentName: "Apprentice Null",
      duelDescription: "Descripción base",
    });
    const startOpponent = pack.lines.find((line) => line.id === "start-opponent");
    expect(startOpponent?.portraitUrl).toContain("opp-ch1-apprentice/intro-GenNvim");
    expect(startOpponent?.audioUrl).toContain("intro.mp3");
  });

  it("usa fallback de descripción en oponentes sin override", () => {
    const pack = buildStoryOpponentNarrationPack({
      opponentId: "unknown-opponent",
      opponentName: "Unknown",
      duelDescription: "Mensaje fallback",
    });
    const startOpponent = pack.lines.find((line) => line.id === "start-opponent");
    expect(startOpponent?.text).toBe("Mensaje fallback");
  });

  it("resuelve líneas nuevas para BigLog con contrato normalizado", () => {
    const pack = buildStoryOpponentNarrationPack({
      opponentId: "opp-ch1-biglog",
      opponentName: "BigLog",
      duelDescription: "Descripción base",
    });
    const startOpponent = pack.lines.find((line) => line.id === "start-opponent");
    const losePlayer = pack.lines.find((line) => line.id === "lose-player");
    expect(startOpponent?.audioUrl).toContain("/audio/story/opp-ch1-biglog/intro.mp3");
    expect(losePlayer?.text).toBe("Este duelo fue mío desde el principio.");
    expect(losePlayer?.portraitUrl).toContain("victoria-BigLog.png");
  });

  it("garantiza que todos los perfiles del catálogo tienen las 7 líneas obligatorias", () => {
    const profileIds = [
      "opp-ch1-apprentice",
      "opp-ch1-biglog",
      "opp-ch1-jaku",
      "opp-ch1-helena",
      "opp-ch1-soldier-act01",
    ] as const;
    for (const profileId of profileIds) {
      const profile = getStoryOpponentNarrationProfile(profileId);
      expect(profile).not.toBeNull();
      expect(profile?.lines.intro.audioFile).toBeTruthy();
      expect(profile?.lines.trap.audioFile).toBeTruthy();
      expect(profile?.lines.fusion.audioFile).toBeTruthy();
      expect(profile?.lines.directHitToPlayer.audioFile).toBeTruthy();
      expect(profile?.lines.directHitToOpponent.audioFile).toBeTruthy();
      expect(profile?.lines.opponentVictory.audioFile).toBeTruthy();
      expect(profile?.lines.opponentDefeat.audioFile).toBeTruthy();
    }
  });
});
