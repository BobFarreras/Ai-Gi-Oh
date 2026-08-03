// src/components/game/board/hooks/internal/match/create-board-match-config.test.ts - Verifica que la configuración de match se derive por modo sin hardcodes en la UI.
import { describe, expect, it } from "vitest";
import { createBoardMatchConfig } from "./create-board-match-config";

describe("create-board-match-config", () => {
  it("aplica defaults de training con ids y nombres desacoplados", () => {
    const config = createBoardMatchConfig({ mode: "TRAINING", seed: "seed-training" });
    expect(config.mode).toBe("TRAINING");
    expect(config.playerA.id).toBe("player-local");
    expect(config.playerB.id).toBe("opponent-local");
    expect(config.playerA.name).toBe("Arquitecto");
    expect(config.playerB.name).toBe("Rival Nexus");
  });

  it("permite sobreescribir ids y nombres desde capa de aplicación", () => {
    const config = createBoardMatchConfig({
      mode: "STORY",
      seed: "seed-story",
      playerId: "user-1",
      playerName: "Neo",
      opponentId: "boss-1",
      opponentName: "Sentinel Prime",
    });
    expect(config.mode).toBe("STORY");
    expect(config.playerA.id).toBe("user-1");
    expect(config.playerA.name).toBe("Neo");
    expect(config.playerB.id).toBe("boss-1");
    expect(config.playerB.name).toBe("Sentinel Prime");
  });

  it("con misma seed genera misma mano inicial potencial", () => {
    const first = createBoardMatchConfig({ mode: "TRAINING", seed: "seed-x" });
    const second = createBoardMatchConfig({ mode: "TRAINING", seed: "seed-x" });
    expect(first.playerA.deck.slice(0, 4).map((card) => card.id)).toEqual(second.playerA.deck.slice(0, 4).map((card) => card.id));
  });

  it.each(["SURVIVAL", "OLYMPUS"] as const)("preserva el modo PvE %s en la configuración", (mode) => {
    expect(createBoardMatchConfig({ mode, seed: `seed-${mode}` }).mode).toBe(mode);
  });
});
