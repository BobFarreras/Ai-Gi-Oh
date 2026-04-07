// src/components/hub/story/internal/scene/actions/story-node-interaction-request.ts - Prepara payload de interacción Story y solicita submission cuando el nodo lo requiere.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";

interface IStoryNodeInteractionPayload {
  nodeId: string;
  submissionAnswer?: string;
}

/**
 * Construye payload de interacción y pide submission manual para nodos de activación.
 */
export function buildStoryNodeInteractionPayload(node: IStoryMapNodeRuntime): IStoryNodeInteractionPayload | null {
  const prompt = resolveStoryNodeSubmissionPrompt(node.id);
  if (!prompt) return { nodeId: node.id };
  const answer = window.prompt(`${prompt.title}\n${prompt.hint}`, prompt.placeholder) ?? "";
  if (!answer.trim()) return null;
  return { nodeId: node.id, submissionAnswer: answer.trim() };
}
