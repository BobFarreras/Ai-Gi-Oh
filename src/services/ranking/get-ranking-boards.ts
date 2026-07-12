// src/services/ranking/get-ranking-boards.ts - Agrega los tres rankings (Multijugador ELO + Actividad +
// Comercial) en un modelo unificado para el selector animado de la página de ranking.
import { getRankingData, MatchResult } from "@/services/ranking/get-ranking-data";
import { getWeeklyLeaderboards, WeeklyLeaderboardBoard } from "@/services/ranking/get-weekly-leaderboards";

export type RankingBoardId = "MULTIPLAYER" | "ACTIVITY" | "COMMERCIAL";

/** Fila unificada de cualquier ranking. `recentForm`/`wins`/`losses` solo existen en el de multijugador. */
export interface IRankingBoardEntry {
  rank: number;
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  /** Métrica que ordena el ranking: ELO en multijugador, puntos en los semanales. */
  value: number;
  wins?: number;
  losses?: number;
  recentForm?: MatchResult[];
  /** Nexus gastados en el mercado esta semana (solo en el tablero comercial). */
  nexusSpent?: number;
}

/** Premio semanal por posición (solo tableros semanales). Fuente: weekly_leaderboard_prizes (BD). */
export interface IRankingBoardPrize {
  rank: number;
  rewardNexus: number;
}

export interface IRankingBoard {
  id: RankingBoardId;
  entries: IRankingBoardEntry[];
  localRank: number | null;
  localValue: number | null;
  /** Premios configurados en BD (vacío/undefined en el tablero de ELO, que no reparte Nexus). */
  prizes?: IRankingBoardPrize[];
}

export interface IRankingBoardsData {
  boards: IRankingBoard[];
  localPlayerId: string | null;
}

const WEEKLY_ID: Record<WeeklyLeaderboardBoard, RankingBoardId> = {
  ACTIVITY: "ACTIVITY",
  COMMERCIAL: "COMMERCIAL",
};

export async function getRankingBoards(): Promise<IRankingBoardsData> {
  const [elo, weekly] = await Promise.all([getRankingData(), getWeeklyLeaderboards()]);

  const multiplayer: IRankingBoard = {
    id: "MULTIPLAYER",
    entries: elo.entries.map((entry) => ({
      rank: entry.rank,
      playerId: entry.playerId,
      nickname: entry.nickname,
      avatarUrl: entry.avatarUrl,
      value: entry.eloRating,
      wins: entry.wins,
      losses: entry.losses,
      recentForm: entry.recentForm,
    })),
    localRank: elo.localPlayerRank,
    localValue: elo.entries.find((entry) => entry.playerId === elo.localPlayerId)?.eloRating ?? null,
  };

  const weeklyBoards: IRankingBoard[] = weekly.boards.map((board) => ({
    id: WEEKLY_ID[board.board],
    entries: board.entries.map((entry) => ({
      rank: entry.rank,
      playerId: entry.playerId,
      nickname: entry.nickname,
      avatarUrl: entry.avatarUrl,
      value: entry.points,
      nexusSpent: entry.nexusSpent,
    })),
    localRank: board.localRank,
    localValue: board.localRank ? board.localPoints : null,
    // Los premios ya se leen de BD en getWeeklyLeaderboards; solo los propagamos (sin consulta extra).
    prizes: board.prizes,
  }));

  // Orden del selector: Multijugador primero (el ranking "de referencia"), luego los semanales.
  const activity = weeklyBoards.find((board) => board.id === "ACTIVITY");
  const commercial = weeklyBoards.find((board) => board.id === "COMMERCIAL");
  const boards = [multiplayer, activity, commercial].filter((board): board is IRankingBoard => Boolean(board));

  return { boards, localPlayerId: elo.localPlayerId };
}
