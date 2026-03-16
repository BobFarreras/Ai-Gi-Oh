// src/services/story/resolve-story-node-interaction-dialogue.test.ts - Verifica resolución de diálogos narrativos por nodo Story.
import { describe, expect, it } from "vitest";
import { resolveStoryNodeInteractionDialogue } from "@/services/story/resolve-story-node-interaction-dialogue";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createNode(overrides: Partial<IStoryMapNodeRuntime> = {}): IStoryMapNodeRuntime {
  return {
    id: "story-ch1-event-briefing",
    chapter: 1,
    duelIndex: 100,
    title: "Nodo",
    opponentName: "NPC",
    nodeType: "EVENT",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    unlockRequirementNodeId: null,
    href: "#",
    isVirtualNode: true,
    ...overrides,
  };
}

describe("resolveStoryNodeInteractionDialogue", () => {
  it("resuelve diálogo específico por nodeId", () => {
    const dialogue = resolveStoryNodeInteractionDialogue(createNode({ id: "story-ch1-event-briefing" }));

    expect(dialogue?.title).toContain("Terminal");
    expect(dialogue?.lines.length).toBeGreaterThan(1);
  });

  it("aplica fallback para nodos virtuales sin plantilla dedicada", () => {
    const dialogue = resolveStoryNodeInteractionDialogue(
      createNode({ id: "story-custom-event", title: "Evento custom" }),
    );

    expect(dialogue?.title).toBe("Evento custom");
    expect(dialogue?.lines[0]?.text).toContain("interacción narrativa");
  });

  it("devuelve variante resumida cuando el nodo ya fue interactuado", () => {
    const dialogue = resolveStoryNodeInteractionDialogue(
      createNode({ id: "story-ch1-event-briefing" }),
      3,
    );

    expect(dialogue?.lines[0]?.text).toContain("Registro recurrente");
  });

  it("resuelve evento scout con puesta en escena y aviso de trampas", () => {
    const dialogue = resolveStoryNodeInteractionDialogue(
      createNode({ id: "story-ch1-event-scout-log", title: "Evento Scout" }),
    );

    expect(dialogue?.title).toContain("Reconocimiento");
    expect(dialogue?.lines.length).toBe(4);
    expect(dialogue?.lines[0]?.side).toBe("RIGHT");
    expect(dialogue?.lines[0]?.text).toContain("cartas trampa muy poderosas");
    expect(dialogue?.lines[0]?.portraitUrl).toContain("intro-GenNvim");
    expect(dialogue?.lines[1]?.portraitUrl).toContain("player/bob.png");
    expect(dialogue?.lines[2]?.speaker).toBe("GenNvim");
    expect(dialogue?.lines[3]?.speaker).toBe("Operador");
    expect(dialogue?.lines[1]?.autoAdvanceMs).toBeGreaterThan(0);
  });

  it("no genera diálogo para nodo de duelo real", () => {
    const dialogue = resolveStoryNodeInteractionDialogue(
      createNode({ id: "story-ch1-duel-1", nodeType: "DUEL", isVirtualNode: false, href: "/hub/story/chapter/1/duel/1" }),
    );

    expect(dialogue).toBeNull();
  });
});
