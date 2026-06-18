// src/components/hub/ranking/internal/tier.ts - Deriva tier de podio (top 3) y liga por ELO para estilos visuales del ranking.

/** Tier de podio para los 3 primeros clasificados. */
export type PodiumTier = "gold" | "silver" | "bronze";

/** Liga derivada del ELO, para glow/marco de filas y cards. */
export type EloLeague = "bronze" | "silver" | "gold" | "diamond" | "master";

export interface ITierStyle {
  /** Clases Tailwind para el glow del avatar/marco (box-shadow estático). */
  glow: string;
  /** Clases Tailwind para el gradiente del marco/avatar. */
  border: string;
  /** Color de texto para el ELO/número. */
  text: string;
  /** Etiqueta legible en español. */
  label: string;
}

/** Mapa de tier de podio → estilos visuales (oro/plata/bronce). */
const PODIUM_STYLES: Record<PodiumTier, ITierStyle> = {
  gold: {
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.6)]",
    border: "border-amber-400/70 bg-gradient-to-br from-amber-500/20 to-yellow-700/20",
    text: "text-amber-300",
    label: "Campeón",
  },
  silver: {
    glow: "shadow-[0_0_20px_rgba(203,213,225,0.5)]",
    border: "border-slate-300/60 bg-gradient-to-br from-slate-300/15 to-slate-500/15",
    text: "text-slate-200",
    label: "Subcampeón",
  },
  bronze: {
    glow: "shadow-[0_0_18px_rgba(180,83,9,0.5)]",
    border: "border-orange-700/60 bg-gradient-to-br from-orange-700/20 to-amber-900/20",
    text: "text-orange-300",
    label: "Tercer puesto",
  },
};

/** Umbrales de liga por ELO. Ordenados de menor a mayor. */
const ELO_LEAGUE_THRESHOLDS: ReadonlyArray<readonly [number, EloLeague]> = [
  [1200, "bronze"],
  [1400, "silver"],
  [1600, "gold"],
  [1800, "diamond"],
  [2000, "master"],
];

const LEAGUE_STYLES: Record<EloLeague, ITierStyle> = {
  bronze: {
    glow: "shadow-[0_0_10px_rgba(180,83,9,0.4)]",
    border: "border-orange-700/50",
    text: "text-orange-300",
    label: "Bronce",
  },
  silver: {
    glow: "shadow-[0_0_10px_rgba(203,213,225,0.35)]",
    border: "border-slate-300/50",
    text: "text-slate-200",
    label: "Plata",
  },
  gold: {
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.45)]",
    border: "border-amber-400/60",
    text: "text-amber-300",
    label: "Oro",
  },
  diamond: {
    glow: "shadow-[0_0_12px_rgba(34,211,238,0.5)]",
    border: "border-cyan-300/60",
    text: "text-cyan-200",
    label: "Diamante",
  },
  master: {
    glow: "shadow-[0_0_14px_rgba(167,139,250,0.55)]",
    border: "border-violet-400/70",
    text: "text-violet-200",
    label: "Maestro",
  },
};

/**
 * Devuelve el tier de podio para una posición de rank (solo 1-3), o null si
 * no está en el podio.
 */
export function getPodiumTier(rank: number): PodiumTier | null {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return null;
}

/**
 * Devuelve la liga correspondiente a un ELO. Por debajo de 1200 → bronze;
 * 1800+ → master. Umbrales alineados con el ELO inicial (1200).
 */
export function getEloLeague(elo: number): EloLeague {
  let league: EloLeague = "bronze";
  for (const [threshold, tier] of ELO_LEAGUE_THRESHOLDS) {
    if (elo >= threshold) league = tier;
  }
  return league;
}

/** Estilos visuales para un tier de podio dado. */
export function getPodiumStyle(tier: PodiumTier): ITierStyle {
  return PODIUM_STYLES[tier];
}

/** Estilos visuales para una liga de ELO dada. */
export function getLeagueStyle(league: EloLeague): ITierStyle {
  return LEAGUE_STYLES[league];
}
