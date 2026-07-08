// src/services/story/overworld/resolve-overworld-node-access.test.ts - Blinda el acceso server-side a nodos del overworld (mundo abierto en Acto 1).
import { isOverworldNodeAccessible } from "@/services/story/overworld/resolve-overworld-node-access";

describe("isOverworldNodeAccessible", () => {
  it("permite el jefe del Acto 1 sin haber ganado ningún duelo (mundo abierto)", () => {
    expect(isOverworldNodeAccessible("act-1", "story-ch1-duel-5", new Set())).toBe(true);
  });

  it("permite cualquier duelo del Acto 1 sin prerequisitos", () => {
    for (const id of ["story-ch1-duel-1", "story-ch1-duel-2", "story-ch1-duel-3", "story-ch1-duel-4"]) {
      expect(isOverworldNodeAccessible("act-1", id, new Set())).toBe(true);
    }
  });

  it("rechaza nodos inexistentes en el mapa", () => {
    expect(isOverworldNodeAccessible("act-1", "story-ch1-duel-999", new Set())).toBe(false);
  });

  it("rechaza mapas desconocidos", () => {
    expect(isOverworldNodeAccessible("act-99", "story-ch1-duel-1", new Set())).toBe(false);
  });
});
