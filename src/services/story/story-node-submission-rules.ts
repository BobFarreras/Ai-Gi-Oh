// src/services/story/story-node-submission-rules.ts - Define validación de submissions especiales en nodos Story de activación.
import { ValidationError } from "@/core/errors/ValidationError";

const BRIDGE_SUBMISSION_NODE_ID = "story-ch2-bridge-submission";
const BRIDGE_SUBMISSION_EXPECTED_CODE = "link-helena-biglog";

/**
 * Valida códigos de submission para nodos que exigen activación manual antes de desbloquear ruta.
 */
export function assertStoryNodeSubmissionValid(nodeId: string, submissionAnswer: string | null): void {
  if (nodeId !== BRIDGE_SUBMISSION_NODE_ID) return;
  if (!submissionAnswer || submissionAnswer.trim().length === 0) {
    throw new ValidationError("Debes completar la submission para sincronizar el puente.");
  }
  const normalized = submissionAnswer.trim().toLowerCase();
  if (normalized !== BRIDGE_SUBMISSION_EXPECTED_CODE) {
    throw new ValidationError("Submission inválida. Revisa la firma del enlace de pasarela.");
  }
}

/**
 * Devuelve metadatos de UI para pedir submission en cliente sin hardcodear textos en la vista.
 */
export function resolveStoryNodeSubmissionPrompt(nodeId: string): { title: string; hint: string; placeholder: string } | null {
  if (nodeId !== BRIDGE_SUBMISSION_NODE_ID) return null;
  return {
    title: "Sincronización de Pasarela",
    hint: "Introduce la firma de enlace para abrir el puente principal.",
    placeholder: "link-helena-biglog",
  };
}
