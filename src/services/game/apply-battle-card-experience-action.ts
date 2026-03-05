// src/services/game/apply-battle-card-experience-action.ts - Cliente HTTP para persistir EXP de cartas al finalizar un duelo.
import { ICardExperienceEvent } from "@/core/services/progression/card-experience-rules";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";

interface IApplyBattleCardExperiencePayload {
  battleId: string;
  events: ICardExperienceEvent[];
}

export async function applyBattleCardExperienceAction(
  battleId: string,
  events: ICardExperienceEvent[],
): Promise<IAppliedCardExperienceResult[]> {
  const payload: IApplyBattleCardExperiencePayload = { battleId, events };
  const response = await fetch("/api/game/progression/apply-battle-exp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as IAppliedCardExperienceResult[] | { message?: string };
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : "No se pudo persistir la experiencia del duelo.";
    throw new Error(message);
  }
  return data as IAppliedCardExperienceResult[];
}
