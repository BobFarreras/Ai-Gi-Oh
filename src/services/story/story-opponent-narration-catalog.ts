// src/services/story/story-opponent-narration-catalog.ts - Catálogo tipado de líneas, retratos y audios narrativos por oponente Story.
export type StoryNarrationSemanticKey =
  | "intro"
  | "trap"
  | "fusion"
  | "directHitToPlayer"
  | "directHitToOpponent"
  | "opponentVictory"
  | "opponentDefeat";

export interface IStoryOpponentVoiceLineDefinition {
  text: string;
  audioFile: string;
  durationMs: number;
}

export interface IStoryOpponentPortraitDefinition {
  intro: string;
  victory: string;
  defeat: string;
}

export interface IStoryOpponentNarrationProfile {
  opponentId: string;
  assetFolder: string;
  portraits: IStoryOpponentPortraitDefinition;
  lines: Record<StoryNarrationSemanticKey, IStoryOpponentVoiceLineDefinition>;
}

const DEFAULT_LINE_DURATION_MS: Record<StoryNarrationSemanticKey, number> = {
  intro: 3600,
  trap: 1900,
  fusion: 3200,
  directHitToPlayer: 1800,
  directHitToOpponent: 1800,
  opponentVictory: 3600,
  opponentDefeat: 3600,
};

function line(key: StoryNarrationSemanticKey, text: string, audioFile: string): IStoryOpponentVoiceLineDefinition {
  return { text, audioFile, durationMs: DEFAULT_LINE_DURATION_MS[key] };
}

function profile(input: IStoryOpponentNarrationProfile): IStoryOpponentNarrationProfile {
  return input;
}

export const STORY_OPPONENT_NARRATION_CATALOG: Record<string, IStoryOpponentNarrationProfile> = {
  "opp-ch1-apprentice": profile({
    opponentId: "opp-ch1-apprentice",
    assetFolder: "opp-ch1-apprentice",
    portraits: { intro: "intro-GenNvim.png", victory: "victoria-GenNvim.png", defeat: "derrota-GenNvim.png" },
    lines: {
      intro: line("intro", "Prepárate para perder.", "intro.mp3"),
      trap: line("trap", "Has caído en mi trampa.", "trampa.mp3"),
      fusion: line("fusion", "La fusión definitiva.", "fusion.mp3"),
      directHitToPlayer: line("directHitToPlayer", "Aún puedo resistir.", "impacto-directo-jugador.mp3"),
      directHitToOpponent: line("directHitToOpponent", "Acaba con sus puntos de vida.", "impacto-directo-opponente.mp3"),
      opponentVictory: line("opponentVictory", "Se acabó, he ganado.", "victoria-oponente.mp3"),
      opponentDefeat: line("opponentDefeat", "La próxima vez ganaré.", "derrota-oponente.mp3"),
    },
  }),
  "opp-ch1-biglog": profile({
    opponentId: "opp-ch1-biglog",
    assetFolder: "opp-ch1-biglog",
    portraits: { intro: "intro-BigLog.png", victory: "victoria-BigLog.png", defeat: "derrota-BigLog.png" },
    lines: {
      intro: line("intro", "Prepárate, no me contendré.", "intro.mp3"),
      trap: line("trap", "Justo como lo planeé.", "trampa.mp3"),
      fusion: line("fusion", "Surge una nueva fuerza.", "fusion.mp3"),
      directHitToPlayer: line("directHitToPlayer", "Maldito!", "impacto-directo-jugador.mp3"),
      directHitToOpponent: line("directHitToOpponent", "No puedes detener esto.", "impacto-directo-opponente.mp3"),
      opponentVictory: line("opponentVictory", "Este duelo fue mío desde el principio.", "victoria-oponente.mp3"),
      opponentDefeat: line("opponentDefeat", "Esto no puede estar pasando.", "derrota-oponente.mp3"),
    },
  }),
  "opp-ch1-jaku": profile({
    opponentId: "opp-ch1-jaku",
    assetFolder: "opp-ch1-jaku",
    portraits: { intro: "intro-Jaku.png", victory: "victoria-Jaku.png", defeat: "derrota-Jaku.png" },
    lines: {
      intro: line("intro", "Hmm, prepárate para perder.", "intro.mp3"),
      trap: line("trap", "No escaparás.", "trampa.mp3"),
      fusion: line("fusion", "Te vas a enterar.", "fusion.mp3"),
      directHitToPlayer: line("directHitToPlayer", "Tuviste suerte.", "impacto-directo-jugador.mp3"),
      directHitToOpponent: line("directHitToOpponent", "Demasiado fácil.", "impacto-directo-opponente.mp3"),
      opponentVictory: line("opponentVictory", "Tus cartas cayeron, una por una.", "victoria-oponente.mp3"),
      opponentDefeat: line("opponentDefeat", "Esto no termina aquí.", "derrota-oponente.mp3"),
    },
  }),
  "opp-ch1-helena": profile({
    opponentId: "opp-ch1-helena",
    assetFolder: "opp-ch1-helena",
    portraits: { intro: "intro-Helena.png", victory: "victoria-Helena.png", defeat: "derrota-Helena.png" },
    lines: {
      intro: line("intro", "Hoy aprenderás quién manda.", "intro.mp3"),
      trap: line("trap", "Demasiado tarde.", "trampa.mp3"),
      fusion: line("fusion", "La combinación perfecta.", "fusion.mp3"),
      directHitToPlayer: line("directHitToPlayer", "No lo vi venir.", "impacto-directo-jugador.mp3"),
      directHitToOpponent: line("directHitToOpponent", "Este golpe acabará contigo.", "impacto-directo-opponente.mp3"),
      opponentVictory: line("opponentVictory", "Nadie puede detenerme.", "victoria-oponente.mp3"),
      opponentDefeat: line("opponentDefeat", "Mis cartas me han fallado.", "derrota-oponente.mp3"),
    },
  }),
  "opp-ch1-soldier-act01": profile({
    opponentId: "opp-ch1-soldier-act01",
    assetFolder: "opp-ch1-soldier-act01",
    portraits: { intro: "intro-Soldado-act01.png", victory: "victoria-Soldado-act01.png", defeat: "derrota-Soldado-act01.png" },
    lines: {
      intro: line("intro", "Este campo de batalla será tu final!", "intro-combate.mp3"),
      trap: line("trap", "Era parte de mi plan.", "trampa.mp3"),
      fusion: line("fusion", "La fusión ha comenzado.", "fusion.mp3"),
      directHitToPlayer: line("directHitToPlayer", "Gah!", "impacto-directo-jugador.mp3"),
      directHitToOpponent: line("directHitToOpponent", "Ahora, ataque final!", "impacto-directo-opponente.mp3"),
      opponentVictory: line("opponentVictory", "Nadie puede detenerme.", "victoria-Soldado-act01.mp3"),
      opponentDefeat: line("opponentDefeat", "Mis cartas me han fallado.", "derrota-Soldado-act01.mp3"),
    },
  }),
};

export function getStoryOpponentNarrationProfile(opponentId: string): IStoryOpponentNarrationProfile | null {
  return STORY_OPPONENT_NARRATION_CATALOG[opponentId] ?? null;
}
