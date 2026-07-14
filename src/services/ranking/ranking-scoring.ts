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
  /** Tableros semanales (reparten premios de Nexus y se reinician cada semana). */
  weekly: boolean;
  /** Nota de cierre (solo tableros semanales). Los importes de premio se leen de BD, no aquí. */
  resetNote?: string;
}

// Texto de cara al jugador: el cierre real es a las 22:00 UTC, que en España equivale a medianoche
// (00:00/24:00), que es lo que refleja la cuenta atrás. Mostramos la hora local para no confundir.
const WEEKLY_RESET = "Cierra cada domingo a las 24:00 (medianoche, hora española).";

/**
 * Guía de puntuación por tablero (la MECÁNICA: qué acciones puntúan). Refleja
 * `weekly_leaderboard_point_rules`. Los IMPORTES de premio NO se hardcodean aquí: se leen en vivo de
 * `weekly_leaderboard_prizes` (BD) y se muestran en el diálogo, para no quedar desactualizados.
 */
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
    weekly: false,
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
    weekly: true,
    resetNote: WEEKLY_RESET,
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
    weekly: true,
    resetNote: WEEKLY_RESET,
  },
};

/** Orden canónico de presentación de los tableros en la documentación. */
export const RANKING_SCORING_ORDER: RankingBoardId[] = ["MULTIPLAYER", "ACTIVITY", "COMMERCIAL"];
