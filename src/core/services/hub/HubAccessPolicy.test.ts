// src/core/services/hub/HubAccessPolicy.test.ts - Pruebas de bloqueo del hub según estado de tutorial y medallas.
import { describe, expect, it } from "vitest";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { resolveHubSectionLock } from "./HubAccessPolicy";

const BASE_PROGRESS: IPlayerHubProgress = {
  playerId: "player-1",
  medals: 0,
  storyChapter: 1,
  hasCompletedTutorial: false,
  hasSeenAcademyIntro: false,
  hasSkippedTutorial: false,
};

function createSection(type: IHubSection["type"]): IHubSection {
  return {
    id: type.toLowerCase(),
    type,
    title: type,
    description: "",
    href: `/hub/${type.toLowerCase()}`,
    isLocked: false,
    lockReason: null,
  };
}

describe("resolveHubSectionLock", () => {
  it("bloquea todo menos training mientras tutorial está pendiente", () => {
    const home = resolveHubSectionLock(createSection("HOME"), BASE_PROGRESS);
    const training = resolveHubSectionLock(createSection("TRAINING"), BASE_PROGRESS);
    expect(home.isLocked).toBe(true);
    expect(training.isLocked).toBe(false);
  });

  it("desbloquea secciones normales al saltar tutorial", () => {
    const progress = { ...BASE_PROGRESS, hasSkippedTutorial: true };
    const market = resolveHubSectionLock(createSection("MARKET"), progress);
    expect(market.isLocked).toBe(false);
  });

  it("mantiene multijugador bloqueado sin medallas tras tutorial", () => {
    const progress = { ...BASE_PROGRESS, hasCompletedTutorial: true };
    const multiplayer = resolveHubSectionLock(createSection("MULTIPLAYER"), progress);
    expect(multiplayer.isLocked).toBe(true);
  });
});
