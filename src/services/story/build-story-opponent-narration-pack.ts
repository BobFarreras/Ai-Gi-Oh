// src/services/story/build-story-opponent-narration-pack.ts - Construye pack narrativo por oponente Story (texto, retratos y audio) para ejecutar duelo sin lecturas de BD.
import { buildDefaultMatchNarrationPack } from "@/components/game/board/narration/build-default-match-narration-pack";
import { IMatchNarrationPack } from "@/components/game/board/narration/types";

interface IBuildStoryOpponentNarrationPackParams {
  opponentId: string;
  opponentName: string;
  duelDescription: string;
}

const STORY_OPPONENT_PACK_OVERRIDES: Record<string, Partial<Record<string, { text?: string; audioUrl?: string; portraitUrl?: string; durationMs?: number }>>> = {
  "opp-ch1-apprentice": {
    "start-opponent": {
      text: "Prepárate para perder.",
      audioUrl: "/audio/story/opp-ch1-apprentice/intro.mp3",
      portraitUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png",
      durationMs: 3600,
    },
    "hit-dealt": {
      text: "Aún puedo resistir.",
      audioUrl: "/audio/story/opp-ch1-apprentice/impacto-directo-jugador.mp3",
      durationMs: 1800,
    },
    "hit-taken": {
      text: "Acaba con sus puntos de vida.",
      audioUrl: "/audio/story/opp-ch1-apprentice/impacto-directo-opponente.mp3",
      durationMs: 1800,
    },
    "trap-opponent": {
      text: "Has caído en mi trampa.",
      audioUrl: "/audio/story/opp-ch1-apprentice/trampa.mp3",
      durationMs: 1900,
    },
    "fusion-opponent": {
      text: "La fusión definitiva.",
      audioUrl: "/audio/story/opp-ch1-apprentice/fusion.mp3",
      portraitUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png",
      durationMs: 3200,
    },
    "win-opponent-defeat": {
      text: "La próxima vez ganaré.",
      audioUrl: "/audio/story/opp-ch1-apprentice/derrota-oponente.mp3",
      portraitUrl: "/assets/story/opponents/opp-ch1-apprentice/derrota-GenNvim.png",
      durationMs: 3600,
    },
    "lose-player": {
      text: "Se acabó, he ganado.",
      audioUrl: "/audio/story/opp-ch1-apprentice/victoria-oponente.mp3",
      portraitUrl: "/assets/story/opponents/opp-ch1-apprentice/victoria-GenNvim.png",
      durationMs: 3600,
    },
  },
};

export function buildStoryOpponentNarrationPack({ opponentId, opponentName, duelDescription }: IBuildStoryOpponentNarrationPackParams): IMatchNarrationPack {
  const basePack = buildDefaultMatchNarrationPack();
  const overrides = STORY_OPPONENT_PACK_OVERRIDES[opponentId] ?? {};
  return {
    lines: basePack.lines.map((line) => {
      if (line.id === "start-opponent") {
        const overridden = overrides[line.id];
        return { ...line, text: overridden?.text ?? duelDescription, audioUrl: overridden?.audioUrl ?? line.audioUrl, portraitUrl: overridden?.portraitUrl ?? line.portraitUrl, durationMs: overridden?.durationMs ?? line.durationMs };
      }
      if (line.id === "lose-player") {
        const overridden = overrides[line.id];
        return { ...line, text: overridden?.text ?? `${opponentName}: el nodo sigue bajo mi control.`, audioUrl: overridden?.audioUrl ?? line.audioUrl, portraitUrl: overridden?.portraitUrl ?? line.portraitUrl, durationMs: overridden?.durationMs ?? line.durationMs };
      }
      const overridden = overrides[line.id];
      if (!overridden) return line;
      return {
        ...line,
        text: overridden.text ?? line.text,
        audioUrl: overridden.audioUrl ?? line.audioUrl,
        portraitUrl: overridden.portraitUrl ?? line.portraitUrl,
        durationMs: overridden.durationMs ?? line.durationMs,
      };
    }),
  };
}
