// src/services/story/build-story-opponent-narration-pack.ts - Construye pack narrativo por oponente Story (texto, retratos y audio) para ejecutar duelo sin lecturas de BD.
import { buildDefaultMatchNarrationPack } from "@/components/game/board/narration/build-default-match-narration-pack";
import { IMatchNarrationPack } from "@/components/game/board/narration/types";
import { getStoryOpponentNarrationProfile } from "@/services/story/story-opponent-narration-catalog";

interface IBuildStoryOpponentNarrationPackParams {
  opponentId: string;
  opponentName: string;
  duelDescription: string;
}

interface IMatchNarrationOverride {
  text: string;
  audioUrl: string;
  durationMs: number;
  portraitUrl?: string;
}

function buildStoryOpponentPackOverrides(opponentId: string): Partial<Record<string, IMatchNarrationOverride>> {
  const profile = getStoryOpponentNarrationProfile(opponentId);
  if (!profile) return {};

  const audioBasePath = `/audio/story/${profile.assetFolder}`;
  const portraitBasePath = `/assets/story/opponents/${profile.assetFolder}`;
  return {
    "start-opponent": {
      text: profile.lines.intro.text,
      audioUrl: `${audioBasePath}/${profile.lines.intro.audioFile}`,
      portraitUrl: `${portraitBasePath}/${profile.portraits.intro}`,
      durationMs: profile.lines.intro.durationMs,
    },
    "hit-dealt": {
      text: profile.lines.directHitToPlayer.text,
      audioUrl: `${audioBasePath}/${profile.lines.directHitToPlayer.audioFile}`,
      durationMs: profile.lines.directHitToPlayer.durationMs,
    },
    "hit-taken": {
      text: profile.lines.directHitToOpponent.text,
      audioUrl: `${audioBasePath}/${profile.lines.directHitToOpponent.audioFile}`,
      durationMs: profile.lines.directHitToOpponent.durationMs,
    },
    "trap-opponent": {
      text: profile.lines.trap.text,
      audioUrl: `${audioBasePath}/${profile.lines.trap.audioFile}`,
      durationMs: profile.lines.trap.durationMs,
    },
    "fusion-opponent": {
      text: profile.lines.fusion.text,
      audioUrl: `${audioBasePath}/${profile.lines.fusion.audioFile}`,
      portraitUrl: `${portraitBasePath}/${profile.portraits.intro}`,
      durationMs: profile.lines.fusion.durationMs,
    },
    "win-opponent-defeat": {
      text: profile.lines.opponentDefeat.text,
      audioUrl: `${audioBasePath}/${profile.lines.opponentDefeat.audioFile}`,
      portraitUrl: `${portraitBasePath}/${profile.portraits.defeat}`,
      durationMs: profile.lines.opponentDefeat.durationMs,
    },
    "lose-player": {
      text: profile.lines.opponentVictory.text,
      audioUrl: `${audioBasePath}/${profile.lines.opponentVictory.audioFile}`,
      portraitUrl: `${portraitBasePath}/${profile.portraits.victory}`,
      durationMs: profile.lines.opponentVictory.durationMs,
    },
  };
}

export function buildStoryOpponentNarrationPack({ opponentId, opponentName, duelDescription }: IBuildStoryOpponentNarrationPackParams): IMatchNarrationPack {
  const basePack = buildDefaultMatchNarrationPack();
  const overrides = buildStoryOpponentPackOverrides(opponentId);
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
