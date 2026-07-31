// src/components/hub/academy/training/modes/survival/survival-api-client.ts - Cliente HTTP tipado del flujo autoritativo de Supervivencia.
import { ICombatProof, ICombatSession } from "@/core/entities/match";
import {
  ISurvivalBattle,
  ISurvivalProgress,
  ISurvivalReward,
  ISurvivalRun,
  SurvivalOutcome,
} from "@/core/entities/survival/ISurvival";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { GameState } from "@/core/use-cases/GameEngine";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { IArenaOpponentPresentation } from "@/services/training/resolve-arena-opponent-presentation";

export interface ISurvivalBattleRuntime {
  battle: ISurvivalBattle;
  resumed: boolean;
  /** Perfil de IA fijado por el ruleset; el cliente debe animar con el mismo que reproduce el servidor. */
  aiProfile: OpponentDifficulty;
  session: ICombatSession;
  initialState: GameState;
  completionTicket: string;
  presentation: IArenaOpponentPresentation;
}

export interface ISurvivalSettlement {
  run: ISurvivalRun;
  progress: ISurvivalProgress;
  battle: ISurvivalBattle;
  outcome: SurvivalOutcome;
  reward: ISurvivalReward;
  duplicate: boolean;
}

/** Ejecuta una mutación Survival y convierte errores HTTP en mensajes aptos para UI. */
async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo completar la operación de Supervivencia.");
  }
  return response.json() as Promise<T>;
}

export interface ISurvivalRunStart {
  run: ISurvivalRun;
  progress: ISurvivalProgress;
  resumed: boolean;
  /** La expedición anterior se cerró como derrota por abandonar un combate jugable. */
  forfeitedPreviousRun: boolean;
  /** Cada cuántas victorias cura el ruleset; la UI no lo fija por su cuenta. */
  milestoneInterval: number;
}

/** Inicia una expedición o recupera la activa de forma idempotente. */
export function startSurvivalRun(): Promise<ISurvivalRunStart> {
  return postJson("/api/survival/runs/start", {});
}

/** Emite la siguiente batalla y restaura la fábrica de ids perdida al serializar JSON. */
export async function issueSurvivalBattle(runId: string): Promise<ISurvivalBattleRuntime> {
  const runtime = await postJson<ISurvivalBattleRuntime>("/api/survival/battles/issue", { runId });
  runtime.initialState.idFactory = createSeededGameEngineIdFactory(runtime.session.seed);
  return runtime;
}

/** Envía exclusivamente el journal y el ticket; el servidor deriva resultado, LP y recompensa. */
export function completeSurvivalBattle(
  completionTicket: string,
  proof: ICombatProof,
): Promise<ISurvivalSettlement> {
  return postJson("/api/survival/battles/complete", { completionTicket, proof });
}
