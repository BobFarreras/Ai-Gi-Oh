// src/services/hub/internal/apply-combat-readiness-lock.test.ts - Verifica bloqueo de secciones de combate si el deck no está completo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { applyCombatReadinessLock } from "@/services/hub/internal/apply-combat-readiness-lock";

const BASE_SECTIONS: IHubSection[] = [
  { id: "home", type: "HOME", title: "Arsenal", description: "", href: "/hub/home", isLocked: false, lockReason: null },
  { id: "market", type: "MARKET", title: "Mercado", description: "", href: "/hub/market", isLocked: false, lockReason: null },
  { id: "training", type: "TRAINING", title: "Entrenamiento", description: "", href: "/hub/training", isLocked: false, lockReason: null },
  { id: "story", type: "STORY", title: "Historia", description: "", href: "/hub/story", isLocked: false, lockReason: null },
  { id: "multiplayer", type: "MULTIPLAYER", title: "Multijugador", description: "", href: "/hub/multiplayer", isLocked: false, lockReason: null },
];

describe("applyCombatReadinessLock", () => {
  it("bloquea secciones de combate cuando el deck principal no está listo", () => {
    const sections = applyCombatReadinessLock(BASE_SECTIONS, { deck: null, fusionDeck: null });
    expect(sections.find((section) => section.type === "HOME")?.isLocked).toBe(false);
    expect(sections.find((section) => section.type === "MARKET")?.isLocked).toBe(false);
    expect(sections.find((section) => section.type === "TRAINING")?.isLocked).toBe(true);
    expect(sections.find((section) => section.type === "STORY")?.isLocked).toBe(true);
    expect(sections.find((section) => section.type === "MULTIPLAYER")?.isLocked).toBe(true);
  });

  it("mantiene secciones sin bloqueo extra cuando el deck está completo", () => {
    const card: ICard = {
      id: "entity-test",
      name: "Test",
      description: "Carta de test.",
      type: "ENTITY",
      faction: "NEUTRAL",
      cost: 1,
      attack: 100,
      defense: 100,
    };
    const sections = applyCombatReadinessLock(BASE_SECTIONS, { deck: Array.from({ length: 20 }, () => card), fusionDeck: null });
    expect(sections.every((section) => section.isLocked === false)).toBe(true);
  });
});
