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
  "opp-gennvim": profile({
    opponentId: "opp-gennvim",
    assetFolder: "opp-ch1-apprentice",
    portraits: { intro: "intro-GenNvim.webp", victory: "victoria-GenNvim.webp", defeat: "derrota-GenNvim.webp" },
    lines: {
      intro: line("intro", "Prepárate para perder.", "intro.m4a"),
      trap: line("trap", "Has caído en mi trampa.", "trampa.m4a"),
      fusion: line("fusion", "La fusión definitiva.", "fusion.m4a"),
      directHitToPlayer: line("directHitToPlayer", "Aún puedo resistir.", "impacto-directo-jugador.m4a"),
      directHitToOpponent: line("directHitToOpponent", "Acaba con sus puntos de vida.", "impacto-directo-opponente.m4a"),
      opponentVictory: line("opponentVictory", "Se acabó, he ganado.", "victoria-oponente.m4a"),
      opponentDefeat: line("opponentDefeat", "La próxima vez ganaré.", "derrota-oponente.m4a"),
    },
  }),
  "opp-biglog": profile({
    opponentId: "opp-biglog",
    assetFolder: "opp-ch1-biglog",
    portraits: { intro: "intro-BigLog.webp", victory: "victoria-BigLog.webp", defeat: "derrota-BigLog.webp" },
    lines: {
      intro: line("intro", "Prepárate, no me contendré.", "intro.m4a"),
      trap: line("trap", "Justo como lo planeé.", "trampa.m4a"),
      fusion: line("fusion", "Surge una nueva fuerza.", "fusion.m4a"),
      directHitToPlayer: line("directHitToPlayer", "Maldito!", "impacto-directo-jugador.m4a"),
      directHitToOpponent: line("directHitToOpponent", "No puedes detener esto.", "impacto-directo-opponente.m4a"),
      opponentVictory: line("opponentVictory", "Este duelo fue mío desde el principio.", "victoria-oponente.m4a"),
      opponentDefeat: line("opponentDefeat", "Esto no puede estar pasando.", "derrota-oponente.m4a"),
    },
  }),
  "opp-jaku": profile({
    opponentId: "opp-jaku",
    assetFolder: "opp-ch1-jaku",
    portraits: { intro: "intro-Jaku.webp", victory: "victoria-Jaku.webp", defeat: "derrota-Jaku.webp" },
    lines: {
      intro: line("intro", "Hmm, prepárate para perder.", "intro.m4a"),
      trap: line("trap", "No escaparás.", "trampa.m4a"),
      fusion: line("fusion", "Te vas a enterar.", "fusion.m4a"),
      directHitToPlayer: line("directHitToPlayer", "Tuviste suerte.", "impacto-directo-jugador.m4a"),
      directHitToOpponent: line("directHitToOpponent", "Demasiado fácil.", "impacto-directo-opponente.m4a"),
      opponentVictory: line("opponentVictory", "Tus cartas cayeron, una por una.", "victoria-oponente.m4a"),
      opponentDefeat: line("opponentDefeat", "Esto no termina aquí.", "derrota-oponente.m4a"),
    },
  }),
  "opp-helena": profile({
    opponentId: "opp-helena",
    assetFolder: "opp-ch1-helena",
    portraits: { intro: "intro-Helena.webp", victory: "victoria-Helena.webp", defeat: "derrota-Helena.webp" },
    lines: {
      intro: line("intro", "Hoy aprenderás quién manda.", "intro.m4a"),
      trap: line("trap", "Demasiado tarde.", "trampa.m4a"),
      fusion: line("fusion", "La combinación perfecta.", "fusion.m4a"),
      directHitToPlayer: line("directHitToPlayer", "No lo vi venir.", "impacto-directo-jugador.m4a"),
      directHitToOpponent: line("directHitToOpponent", "Este golpe acabará contigo.", "impacto-directo-opponente.m4a"),
      opponentVictory: line("opponentVictory", "Nadie puede detenerme.", "victoria-oponente.m4a"),
      opponentDefeat: line("opponentDefeat", "Mis cartas me han fallado.", "derrota-oponente.m4a"),
    },
  }),
  "opp-soldier-act01": profile({
    opponentId: "opp-soldier-act01",
    assetFolder: "opp-ch1-soldier-act01",
    portraits: { intro: "intro-Soldado-act01.webp", victory: "victoria-Soldado-act01.webp", defeat: "derrota-Soldado-act01.webp" },
    lines: {
      intro: line("intro", "Este campo de batalla será tu final!", "intro-combate.m4a"),
      trap: line("trap", "Era parte de mi plan.", "trampa.m4a"),
      fusion: line("fusion", "La fusión ha comenzado.", "fusion.m4a"),
      directHitToPlayer: line("directHitToPlayer", "Gah!", "impacto-directo-jugador.m4a"),
      directHitToOpponent: line("directHitToOpponent", "Ahora, ataque final!", "impacto-directo-opponente.m4a"),
      opponentVictory: line("opponentVictory", "Nadie puede detenerme.", "victoria-Soldado-act01.m4a"),
      opponentDefeat: line("opponentDefeat", "Mis cartas me han fallado.", "derrota-Soldado-act01.m4a"),
    },
  }),
};

export function getStoryOpponentNarrationProfile(opponentId: string): IStoryOpponentNarrationProfile | null {
  return STORY_OPPONENT_NARRATION_CATALOG[opponentId] ?? null;
}
