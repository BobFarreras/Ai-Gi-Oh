// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/internal/use-story-duel-result-sync.ts - Sincroniza resultado/abandono del duelo Story y devuelve estado listo para UI.
import { useRef, useState } from "react";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { postStoryDuelCompletion } from "../story-duel-completion-client";
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

function buildFallbackTransition(input: IStoryDuelResultSyncInput): IStoryDuelTransition {
  return {
    outcome: "LOST",
    duelNodeId: `story-ch${input.chapter}-duel-${input.duelIndex}`,
    returnNodeId: "story-ch1-player-start",
    penaltyNexus: 0,
  };
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
  const [resultTransition, setResultTransition] = useState<IStoryDuelTransition | null>(null);
  const hasPostedResultRef = useRef(false);

  const returnBasePath = input.returnBasePath ?? "/hub/story";
  const handleResultAction = (): void => {
    pushBackToStory(resultTransition ?? buildFallbackTransition(input), returnBasePath);
  };

  const handleMatchResolved = async (result: { winnerPlayerId: string | "DRAW"; playerId: string; flawless?: boolean }): Promise<void> => {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    setIsBossSoundtrackStopped(true);
    const outcome: StoryDuelOutcome = result.winnerPlayerId === result.playerId ? "WON" : "LOST";
    setStatus(outcome === "WON" ? "Registrando victoria y recompensas..." : "Registrando derrota...");
    track("duel_ended", "gameplay", { mode: "STORY", chapter: input.chapter, duelIndex: input.duelIndex, outcome });
    try {
      const payload = await postStoryDuelCompletion({
        chapter: input.chapter,
        duelIndex: input.duelIndex,
        outcome,
        completionTicket: input.completionTicket,
        flawless: result.flawless ?? false,
      });
      setResultTransition({
        outcome,
        duelNodeId: payload.duelNodeId,
        returnNodeId: payload.returnNodeId,
        penaltyNexus: payload.penaltyNexus,
      });
      setRewardSummary({
        rewardNexus: payload.rewardNexus,
        rewardPlayerExperience: payload.rewardPlayerExperience,
        rewardCards: payload.rewardCards,
      });
      setStatus("Resultado Story sincronizado.");
    } catch {
      setStatus("No se pudo registrar el resultado Story.");
      hasPostedResultRef.current = false;
    }
  };

  const handleAbortMatch = async (): Promise<void> => {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
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

