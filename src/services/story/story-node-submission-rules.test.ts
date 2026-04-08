// src/services/story/story-node-submission-rules.test.ts - Verifica validación de submission en nodos Story con activación obligatoria.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  assertStoryNodeSubmissionRequirements,
  assertStoryNodeSubmissionValid,
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

  it("expone metadatos de prompt solo para nodos con submission", () => {
    expect(resolveStoryNodeSubmissionPrompt("story-ch2-bridge-submission")).not.toBeNull();
    expect(resolveStoryNodeSubmissionPrompt("story-ch2-event-core")).toBeNull();
  });
});
