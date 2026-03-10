// src/core/services/story/world/resolve-story-node-interaction.test.ts - Verifica acción principal por tipo de nodo Story.
import { resolveStoryNodeInteraction } from "@/core/services/story/world/resolve-story-node-interaction";

describe("resolveStoryNodeInteraction", () => {
  it("mapea duelo a entrada de combate", () => {
    const interaction = resolveStoryNodeInteraction({ nodeType: "DUEL" });
    expect(interaction.actionKind).toBe("ENTER_DUEL");
    expect(interaction.requiresBattle).toBe(true);
  });

  it("mapea evento a activación narrativa", () => {
    const interaction = resolveStoryNodeInteraction({ nodeType: "EVENT" });
    expect(interaction.actionKind).toBe("TRIGGER_EVENT");
    expect(interaction.actionLabel).toBe("Activar evento");
  });

  it("mapea reward a reclamación sin combate", () => {
    const interaction = resolveStoryNodeInteraction({ nodeType: "REWARD_NEXUS" });
    expect(interaction.actionKind).toBe("CLAIM_REWARD");
    expect(interaction.requiresBattle).toBe(false);
  });
});
