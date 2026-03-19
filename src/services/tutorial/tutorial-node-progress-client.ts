// src/services/tutorial/tutorial-node-progress-client.ts - Cliente HTTP de progreso/claim del tutorial desacoplado de rutas App Router.
import { ValidationError } from "@/core/errors/ValidationError";

interface INodeCompletionResponse {
  nodeId: string;
}

interface IRewardClaimResponse {
  applied: boolean;
  rewardKind: "NEXUS";
  rewardNexus: number;
}

interface ICombatRewardClaimResponse {
  applied: boolean;
  rewardCardId: string;
}

/**
 * Registra completion idempotente de un nodo tutorial.
 */
export async function postTutorialNodeCompletion(nodeId: string): Promise<INodeCompletionResponse> {
  const response = await fetch("/api/tutorial/nodes/complete", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodeId }),
  });
  if (!response.ok) throw new ValidationError("No se pudo registrar el progreso del nodo tutorial.");
  return response.json() as Promise<INodeCompletionResponse>;
}

/**
 * Reclama recompensa final del tutorial cuando el progreso es elegible.
 */
export async function postTutorialRewardClaim(): Promise<IRewardClaimResponse> {
  const response = await fetch("/api/tutorial/reward/claim", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new ValidationError("No se pudo reclamar la recompensa final del tutorial.");
  return response.json() as Promise<IRewardClaimResponse>;
}

/**
 * Reclama recompensa de carta del nodo de combate tutorial.
 */
export async function postTutorialCombatRewardClaim(): Promise<ICombatRewardClaimResponse> {
  const response = await fetch("/api/tutorial/combat/reward/claim", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new ValidationError("No se pudo reclamar la carta de recompensa del tutorial de combate.");
  return response.json() as Promise<ICombatRewardClaimResponse>;
}
