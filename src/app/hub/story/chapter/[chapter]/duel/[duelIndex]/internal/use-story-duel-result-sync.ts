// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/internal/use-story-duel-result-sync.ts - Sincroniza resultado/abandono del duelo Story y devuelve estado listo para UI.
import { useRef, useState } from "react";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { IPostStoryDuelCompletionOutput, postStoryDuelCompletion } from "../story-duel-completion-client";
import { track } from "@/services/analytics/client/analytics-buffer";

interface IStoryDuelResultSyncInput {
  chapter: number;
  duelIndex: number;
  completionTicket: string;
  /** Ruta base de retorno tras el duelo (por defecto el mapa Story clásico). */
  returnBasePath?: string;
}

interface IStoryDuelTransition {
  outcome: StoryDuelOutcome;
  duelNodeId: string;
  returnNodeId: string;
  penaltyNexus: number;
}

/**
 * Tope de espera del cierre al pulsar "Volver": si el servidor no contesta, el jugador vuelve igualmente
 * al mapa (con su resultado REAL) en vez de quedarse atrapado en la pantalla de resultado.
 */
const COMPLETION_WAIT_MS = 12000;

/**
 * Retorno de emergencia cuando el cierre no ha podido confirmarse. Usa el resultado que YA conocemos en
 * cliente: dar por perdido un duelo ganado mandaba al jugador al inicio del acto (el overworld reaparece en
 * el spawn con `outcome=LOST`) aunque el servidor sí hubiera registrado la victoria.
 */
function buildFallbackTransition(input: IStoryDuelResultSyncInput, outcome: StoryDuelOutcome): IStoryDuelTransition {
  const duelNodeId = `story-ch${input.chapter}-duel-${input.duelIndex}`;
  return {
    outcome,
    duelNodeId,
    returnNodeId: outcome === "WON" ? duelNodeId : "story-ch1-player-start",
    penaltyNexus: 0,
  };
}

/** Espera a que una promesa se resuelva o falle, sin superar `ms` (nunca lanza). */
async function settleWithin(promise: Promise<unknown> | null, ms: number): Promise<void> {
  if (!promise) return;
  await Promise.race([
    promise.catch(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    }),
  ]);
}

function pushBackToStory(input: IStoryDuelTransition, returnBasePath: string): void {
  // El overworld lee el progreso real de la BD; no necesita los params de transición clásica,
  // pero sí el resultado: al perder o abandonar se reaparece al inicio del acto (no en el sitio),
  // y arrastramos el Nexus penalizado para avisar al jugador en el mapa.
  if (returnBasePath !== "/hub/story") {
    const query = new URLSearchParams({ outcome: input.outcome, hardReload: Date.now().toString() });
    if (input.penaltyNexus > 0) query.set("penalty", String(input.penaltyNexus));
    window.location.replace(`${returnBasePath}?${query.toString()}`);
    return;
  }
  const query = new URLSearchParams({
    duelOutcome: input.outcome,
    duelNodeId: input.duelNodeId,
    returnNodeId: input.returnNodeId,
    hardReload: Date.now().toString(),
  });
  window.location.replace(`/hub/story?${query.toString()}`);
}

/**
 * Encapsula la escritura de resultado Story para que el componente solo renderice.
 */
export function useStoryDuelResultSync(input: IStoryDuelResultSyncInput) {
  const [status, setStatus] = useState<string | null>(null);
  const [isBossSoundtrackStopped, setIsBossSoundtrackStopped] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<IDuelResultRewardSummary | null>(null);
  const hasPostedResultRef = useRef(false);
  // Clave de idempotencia de la Recaudación: UNA por instancia de duelo. Si el post falla y se reintenta,
  // se reutiliza la misma → el servidor nunca acredita dos veces el mismo cierre.
  const passiveNexusOperationIdRef = useRef<string>(crypto.randomUUID());
  // El cierre EN VUELO y su resultado, en refs: el botón "Volver" se pulsa a menudo antes de que el POST
  // aterrice (el cierre de un boss es el más lento) y `window.location.replace` aborta el fetch. Antes se
  // navegaba en ese hueco con un resultado inventado ("LOST") y una victoria acababa devolviendo al
  // jugador al inicio del acto. Ahora se espera al cierre real.
  const completionPromiseRef = useRef<Promise<unknown> | null>(null);
  const transitionRef = useRef<IStoryDuelTransition | null>(null);
  const localOutcomeRef = useRef<StoryDuelOutcome | null>(null);
  const isReturningRef = useRef(false);

  const returnBasePath = input.returnBasePath ?? "/hub/story";

  function applyCompletionPayload(outcome: StoryDuelOutcome, payload: IPostStoryDuelCompletionOutput): void {
    transitionRef.current = {
      outcome,
      duelNodeId: payload.duelNodeId,
      returnNodeId: payload.returnNodeId,
      penaltyNexus: payload.penaltyNexus,
    };
    setRewardSummary({
      // El Nexus de la Recaudación acreditado se suma al total mostrado: es Nexus recibido en este cierre.
      rewardNexus: payload.rewardNexus + payload.passiveNexusCredited,
      rewardPlayerExperience: payload.rewardPlayerExperience,
      rewardCards: payload.rewardCards,
    });
  }

  /** Envía el cierre del duelo terminado (victoria/derrota) y guarda su transición. */
  async function postFinishedResult(outcome: StoryDuelOutcome, result: { flawless?: boolean; passiveNexusEarned?: number }): Promise<void> {
    const payload = await postStoryDuelCompletion({
      chapter: input.chapter,
      duelIndex: input.duelIndex,
      outcome,
      completionTicket: input.completionTicket,
      flawless: result.flawless ?? false,
      // Recaudación: solo se reporta en duelos TERMINADOS (el abandono ni lo envía). El servidor topa.
      passiveNexusEarned: result.passiveNexusEarned ?? 0,
      passiveNexusOperationId: passiveNexusOperationIdRef.current,
    });
    applyCompletionPayload(outcome, payload);
  }

  const handleMatchResolved = async (result: { winnerPlayerId: string | "DRAW"; playerId: string; flawless?: boolean; passiveNexusEarned?: number }): Promise<void> => {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    setIsBossSoundtrackStopped(true);
    const outcome: StoryDuelOutcome = result.winnerPlayerId === result.playerId ? "WON" : "LOST";
    localOutcomeRef.current = outcome;
    setStatus(outcome === "WON" ? "Registrando victoria y recompensas..." : "Registrando derrota...");
    track("duel_ended", "gameplay", { mode: "STORY", chapter: input.chapter, duelIndex: input.duelIndex, outcome });
    const pending = postFinishedResult(outcome, result);
    completionPromiseRef.current = pending;
    try {
      await pending;
      setStatus("Resultado Story sincronizado.");
    } catch {
      setStatus("No se pudo registrar el resultado Story.");
      hasPostedResultRef.current = false;
    }
  };

  /**
   * Transición REAL del cierre: si aún está en vuelo se espera, y si falló se reintenta una vez con la misma
   * clave de idempotencia. Devuelve `null` solo si el servidor sigue sin confirmar.
   */
  async function resolveConfirmedTransition(): Promise<IStoryDuelTransition | null> {
    if (transitionRef.current) return transitionRef.current;
    setStatus("Guardando el resultado del duelo...");
    await settleWithin(completionPromiseRef.current, COMPLETION_WAIT_MS);
    if (transitionRef.current) return transitionRef.current;
    const outcome = localOutcomeRef.current;
    if (!outcome) return null;
    const retry = postFinishedResult(outcome, {});
    completionPromiseRef.current = retry;
    await settleWithin(retry, COMPLETION_WAIT_MS);
    return transitionRef.current;
  }

  const handleResultAction = async (): Promise<void> => {
    if (isReturningRef.current) return;
    isReturningRef.current = true;
    const confirmed = await resolveConfirmedTransition();
    pushBackToStory(
      confirmed ?? buildFallbackTransition(input, localOutcomeRef.current ?? "LOST"),
      returnBasePath,
    );
  };

  const handleAbortMatch = async (): Promise<void> => {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    localOutcomeRef.current = "ABANDONED";
    setIsBossSoundtrackStopped(true);
    setStatus("Sincronizando abandono y retorno al mapa Story...");
    track("duel_ended", "gameplay", { mode: "STORY", chapter: input.chapter, duelIndex: input.duelIndex, outcome: "ABANDONED" });
    try {
      const payload = await postStoryDuelCompletion({
        chapter: input.chapter,
        duelIndex: input.duelIndex,
        outcome: "ABANDONED",
        completionTicket: input.completionTicket,
      });
      pushBackToStory(
        {
          outcome: "ABANDONED",
          duelNodeId: payload.duelNodeId,
          returnNodeId: payload.returnNodeId,
          penaltyNexus: payload.penaltyNexus,
        },
        returnBasePath,
      );
    } catch {
      hasPostedResultRef.current = false;
      setStatus("No se pudo sincronizar el abandono Story.");
    }
  };

  return {
    status,
    rewardSummary,
    isBossSoundtrackStopped,
    handleResultAction,
    handleMatchResolved,
    handleAbortMatch,
  };
}
