// src/services/story/story-node-submission-rules.ts - Define validación de submissions especiales en nodos Story de activación.
import { ValidationError } from "@/core/errors/ValidationError";

const BRIDGE_SUBMISSION_NODE_ID = "story-ch2-bridge-submission";
const BRIDGE_SUBMISSION_EXPECTED_CODE = "BRG-7719-9924";
const BRIDGE_SUBMISSION_REQUIRED_KEY_NODE_IDS = [
  "story-ch2-branch-lower-up-event",
  "story-ch2-link-recovered-event",
] as const;

export interface IStoryNodeSubmissionPrompt {
  title: string;
  hint: string;
  placeholder: string;
  activationLabel: string;
  generatedCode: string;
  requiredNodeIds: string[];
}

function requiresBridgeSubmission(nodeId: string): boolean {
  return nodeId === BRIDGE_SUBMISSION_NODE_ID;
}

/**
 * Valida códigos de submission para nodos que exigen activación manual antes de desbloquear ruta.
 */
export function assertStoryNodeSubmissionValid(nodeId: string, submissionAnswer: string | null): void {
  if (!requiresBridgeSubmission(nodeId)) return;
  if (!submissionAnswer || submissionAnswer.trim().length === 0) {
    throw new ValidationError("Debes completar la submission para sincronizar el puente.");
  }
  const normalized = submissionAnswer.trim().toLowerCase();
  if (normalized !== BRIDGE_SUBMISSION_EXPECTED_CODE.toLowerCase()) {
    throw new ValidationError("Submission inválida. Revisa la firma del enlace de pasarela.");
  }
}

/**
 * Exige que las llaves narrativas del acto estén resueltas antes de permitir submission.
 */
export function assertStoryNodeSubmissionRequirements(input: {
  nodeId: string;
  completedNodeIds: string[];
  interactedNodeIds: string[];
}): void {
  if (!requiresBridgeSubmission(input.nodeId)) return;
  const missing = BRIDGE_SUBMISSION_REQUIRED_KEY_NODE_IDS.filter(
    (requiredNodeId) =>
      !input.completedNodeIds.includes(requiredNodeId) &&
      !input.interactedNodeIds.includes(requiredNodeId),
  );
  if (missing.length > 0) {
    throw new ValidationError("Faltan llaves de enlace. Completa los eventos clave antes de sincronizar el puente.");
  }
}

/**
 * Devuelve metadatos de UI para pedir submission en cliente sin hardcodear textos en la vista.
 */
export function resolveStoryNodeSubmissionPrompt(nodeId: string): IStoryNodeSubmissionPrompt | null {
  if (!requiresBridgeSubmission(nodeId)) return null;
  return {
    title: "Sincronización de Pasarela",
    hint: "Conecta ambas llaves y ejecuta la secuencia de enlace para abrir el puente principal.",
    placeholder: "BRG-XXXX-XXXX",
    activationLabel: "Conectar llaves",
    generatedCode: BRIDGE_SUBMISSION_EXPECTED_CODE,
    requiredNodeIds: [...BRIDGE_SUBMISSION_REQUIRED_KEY_NODE_IDS],
  };
}
