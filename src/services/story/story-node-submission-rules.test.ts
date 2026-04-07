// src/services/story/story-node-submission-rules.test.ts - Verifica validación de submission en nodos Story con activación obligatoria.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertStoryNodeSubmissionValid, resolveStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";

describe("story-node-submission-rules", () => {
  it("no exige submission en nodos normales", () => {
    expect(() => assertStoryNodeSubmissionValid("story-ch2-event-core", null)).not.toThrow();
  });

  it("exige respuesta correcta en submission del puente", () => {
    expect(() => assertStoryNodeSubmissionValid("story-ch2-bridge-submission", "wrong")).toThrow(ValidationError);
    expect(() => assertStoryNodeSubmissionValid("story-ch2-bridge-submission", "link-helena-biglog")).not.toThrow();
  });

  it("expone metadatos de prompt solo para nodos con submission", () => {
    expect(resolveStoryNodeSubmissionPrompt("story-ch2-bridge-submission")).not.toBeNull();
    expect(resolveStoryNodeSubmissionPrompt("story-ch2-event-core")).toBeNull();
  });
});
