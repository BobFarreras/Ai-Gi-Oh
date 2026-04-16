// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/internal/use-story-duel-result-sync.ts - Sincroniza resultado/abandono del duelo Story y devuelve estado listo para UI.
import { useRef, useState } from "react";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { StoryDuelOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { postStoryDuelCompletion } from "../story-duel-completion-client";

interface IStoryDuelResultSyncInput {
  chapter: number;
  duelIndex: number;
}

interface IStoryDuelTransition {
  outcome: StoryDuelOutcome;
  duelNodeId: string;
  returnNodeId: string;
}

function buildFallbackTransition(input: IStoryDuelResultSyncInput): IStoryDuelTransition {
  return {
    outcome: "LOST",
    duelNodeId: `story-ch${input.chapter}-duel-${input.duelIndex}`,
    returnNodeId: "story-ch1-player-start",
  };
}

function pushBackToStory(input: IStoryDuelTransition): void {
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

  const handleResultAction = (): void => {
    pushBackToStory(resultTransition ?? buildFallbackTransition(input));
  };

  const handleMatchResolved = async (result: { winnerPlayerId: string | "DRAW"; playerId: string }): Promise<void> => {
    if (hasPostedResultRef.current) return;
    hasPostedResultRef.current = true;
    setIsBossSoundtrackStopped(true);
    const outcome: StoryDuelOutcome = result.winnerPlayerId === result.playerId ? "WON" : "LOST";
    setStatus(outcome === "WON" ? "Registrando victoria y recompensas..." : "Registrando derrota...");
    try {
      const payload = await postStoryDuelCompletion({
        chapter: input.chapter,
        duelIndex: input.duelIndex,
        outcome,
      });
      setResultTransition({
        outcome,
        duelNodeId: payload.duelNodeId,
        returnNodeId: payload.returnNodeId,
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
    try {
      const payload = await postStoryDuelCompletion({
        chapter: input.chapter,
        duelIndex: input.duelIndex,
        outcome: "ABANDONED",
      });
      pushBackToStory({
        outcome: "ABANDONED",
        duelNodeId: payload.duelNodeId,
        returnNodeId: payload.returnNodeId,
      });
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

