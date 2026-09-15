// src/services/story/story-node-submission-rules.test.ts - Verifica validación de submission en nodos Story con activación obligatoria.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  assertStoryNodeSubmissionRequirements,
  assertStoryNodeSubmissionValid,
  isCodeBearingStoryNodeId,
  listStoryNodeKeyFragmentSourceIds,
  resolveStoryNodeSubmissionPrompt,
} from "@/services/story/story-node-submission-rules";

describe("story-node-submission-rules", () => {
  it("no exige submission en nodos normales", () => {
    expect(() => assertStoryNodeSubmissionValid("story-ch2-event-core", null)).not.toThrow();
  });

  it("exige respuesta correcta en submission del puente", () => {
    expect(() => assertStoryNodeSubmissionValid("story-ch2-bridge-submission", "wrong")).toThrow(ValidationError);
    expect(() => assertStoryNodeSubmissionValid("story-ch2-bridge-submission", "BRG-7719-9924")).not.toThrow();
  });

  it("bloquea submission si faltan llaves narrativas", () => {
    expect(() =>
      assertStoryNodeSubmissionRequirements({
        nodeId: "story-ch2-bridge-submission",
        completedNodeIds: [],
        interactedNodeIds: ["story-ch2-branch-lower-up-event"],
      }),
    ).toThrow(ValidationError);
    expect(() =>
      assertStoryNodeSubmissionRequirements({
        nodeId: "story-ch2-bridge-submission",
        completedNodeIds: [],
        interactedNodeIds: ["story-ch2-branch-lower-up-event", "story-ch2-link-recovered-event"],
      }),
    ).not.toThrow();
  });

  it("todo nodo que entrega un fragmento es re-leíble, o el jugador puede perder el código", () => {
    for (const nodeId of listStoryNodeKeyFragmentSourceIds()) {
      expect(isCodeBearingStoryNodeId(nodeId)).toBe(true);
    }
  });

  it("no marca como re-leíble un evento narrativo cualquiera", () => {
    expect(isCodeBearingStoryNodeId("story-ch6-event-trail")).toBe(false);
  });

  it("expone metadatos de prompt solo para nodos con submission", () => {
    expect(resolveStoryNodeSubmissionPrompt("story-ch2-bridge-submission")).not.toBeNull();
    expect(resolveStoryNodeSubmissionPrompt("story-ch2-event-core")).toBeNull();
  });

  describe("fragmentos recuperables del terminal del borde (Acto 6)", () => {
    it("encadenados en orden reconstruyen exactamente el código del terminal", () => {
      const prompt = resolveStoryNodeSubmissionPrompt("story-ch6-edge-terminal");
      expect(prompt).not.toBeNull();
      const chained = prompt!.keyFragments.map((entry) => entry.fragment).join("");
      expect(chained).toBe(prompt!.generatedCode);
      expect(() => assertStoryNodeSubmissionValid("story-ch6-edge-terminal", chained)).not.toThrow();
    });

    it("cada fragmento cuelga de una llave de router realmente exigida", () => {
      const prompt = resolveStoryNodeSubmissionPrompt("story-ch6-edge-terminal")!;
      expect(prompt.keyFragments).toHaveLength(3);
      for (const entry of prompt.keyFragments) {
        expect(prompt.requiredNodeIds).toContain(entry.nodeId);
      }
    });

    it("no regala fragmentos en puzzles que no se arman por trozos", () => {
      expect(resolveStoryNodeSubmissionPrompt("story-ch3-firewall-terminal")!.keyFragments).toEqual([]);
      expect(resolveStoryNodeSubmissionPrompt("story-ch2-bridge-submission")!.keyFragments).toEqual([]);
    });

    it("sigue exigiendo las tres regiones aunque el terminal recuerde los fragmentos", () => {
      expect(() =>
        assertStoryNodeSubmissionRequirements({
          nodeId: "story-ch6-edge-terminal",
          completedNodeIds: [],
          interactedNodeIds: ["story-ch6-key-north", "story-ch6-key-east"],
        }),
      ).toThrow(ValidationError);
    });

    it("las tres consolas de router se pueden releer siempre", () => {
      expect(isCodeBearingStoryNodeId("story-ch6-key-north")).toBe(true);
      expect(isCodeBearingStoryNodeId("story-ch6-key-east")).toBe(true);
      expect(isCodeBearingStoryNodeId("story-ch6-key-south")).toBe(true);
    });

    it("devuelve copias: mutar el prompt no contamina el catálogo", () => {
      const first = resolveStoryNodeSubmissionPrompt("story-ch6-edge-terminal")!;
      first.keyFragments[0].fragment = "ROTO";
      expect(resolveStoryNodeSubmissionPrompt("story-ch6-edge-terminal")!.keyFragments[0].fragment).toBe("EDGE-40");
    });
  });
});
