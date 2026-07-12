// src/services/ranking/ranking-scoring.ts - Fuente única (espejo TS de weekly_leaderboard_point_rules,
// migración 094) de cómo puntúa cada ranking. La consumen el chip de ayuda "?" del ranking y el Códex
// de Academy, para no duplicar las reglas de puntuación en la UI. Los números viven aquí, no en las vistas.
import type { RankingBoardId } from "./get-ranking-boards";

export interface IRankingScoringRule {
  /** Acción del jugador que otorga puntos. */
  action: string;
  /** Puntos que suma (o "+ELO" / "−ELO" para el tablero de habilidad). */
  points: string;
}

export interface IRankingScoringGuide {
  boardId: RankingBoardId;
  title: string;
  cadence: string;
  summary: string;
  rules: IRankingScoringRule[];
  /** Nota de cierre (solo tableros semanales). */
  resetNote?: string;
  /** Resumen de premios (solo tableros semanales). */
  prizes?: string;
}

const WEEKLY_RESET = "Cierra cada domingo a las 22:00 UTC (medianoche en España).";
const WEEKLY_PRIZES = "Premios semanales al top 5: 1000 / 600 / 400 / 250 / 150 Nexus.";

/** Guía de puntuación por tablero. Debe reflejar `weekly_leaderboard_point_rules` de la BD. */
export const RANKING_SCORING_GUIDES: Record<RankingBoardId, IRankingScoringGuide> = {
  MULTIPLAYER: {
    boardId: "MULTIPLAYER",
    title: "Multijugador · ELO",
    cadence: "Clasificación permanente",
    summary:
      "Tu ELO mide tu habilidad en los duelos multijugador: sube al ganar y baja al perder. No se reinicia cada semana.",
    rules: [
      { action: "Ganar un duelo multijugador", points: "+ELO" },
      { action: "Perder un duelo multijugador", points: "−ELO" },
    ],
  },
  ACTIVITY: {
    boardId: "ACTIVITY",
    title: "Actividad · semanal",
    cadence: "Ranking semanal",
    summary: "Premia jugar de forma proactiva durante la semana. Cada acción suma puntos de actividad.",
    rules: [
      { action: "Jugar un duelo de Historia", points: "+20" },
      { action: "Jugar un combate de Arena", points: "+20" },
      { action: "Jugar una partida Multijugador", points: "+20" },
      { action: "Reclamar una misión, evento o diaria", points: "+15" },
    ],
    resetNote: WEEKLY_RESET,
    prizes: WEEKLY_PRIZES,
  },
  COMMERCIAL: {
    boardId: "COMMERCIAL",
    title: "Comercio · semanal",
    cadence: "Ranking semanal",
    summary: "Premia dinamizar el mercado durante la semana comprando y evolucionando cartas.",
    rules: [
      { action: "Comprar una carta en el mercado", points: "+10" },
      { action: "Comprar un pack de sobres", points: "+30" },
      { action: "Evolucionar una carta", points: "+20" },
    ],
    resetNote: WEEKLY_RESET,
    prizes: WEEKLY_PRIZES,
  },
};

/** Orden canónico de presentación de los tableros en la documentación. */
export const RANKING_SCORING_ORDER: RankingBoardId[] = ["MULTIPLAYER", "ACTIVITY", "COMMERCIAL"];
