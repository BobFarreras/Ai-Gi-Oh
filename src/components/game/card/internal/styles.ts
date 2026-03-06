import { Faction, ICard } from "@/core/entities/ICard";

export const FACTION_STYLES: Record<Faction, { wrapper: string; inner: string }> = {
  OPEN_SOURCE: {
    wrapper: "bg-gradient-to-br from-emerald-400 to-emerald-900 shadow-emerald-500/30",
    inner: "from-emerald-950 via-zinc-950 to-black",
  },
  BIG_TECH: {
    wrapper: "bg-gradient-to-br from-blue-400 to-blue-900 shadow-blue-500/30",
    inner: "from-blue-950 via-zinc-950 to-black",
  },
  NO_CODE: {
    wrapper: "bg-gradient-to-br from-purple-400 to-purple-900 shadow-purple-500/30",
    inner: "from-purple-950 via-zinc-950 to-black",
  },
  NEUTRAL: {
    wrapper: "bg-gradient-to-br from-zinc-400 to-zinc-700 shadow-zinc-500/30",
    inner: "from-zinc-900 via-zinc-950 to-black",
  },
};

export const CARD_CLIP_PATHS = {
  outer: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)",
  inner: "polygon(19px 0, 100% 0, 100% calc(100% - 19px), calc(100% - 19px) 100%, 0 100%, 0 19px)",
};

function entityCostPalette(cost: number): { wrapper: string; inner: string } {
  if (cost <= 3) {
    return {
      wrapper: "bg-gradient-to-br from-amber-400 to-amber-900 shadow-amber-500/30",
      inner: "from-amber-950 via-zinc-950 to-black",
    };
  }

  if (cost <= 5) {
    return {
      wrapper: "bg-gradient-to-br from-blue-400 to-blue-900 shadow-blue-500/30",
      inner: "from-blue-950 via-zinc-950 to-black",
    };
  }

  return {
    wrapper: "bg-gradient-to-br from-yellow-200 to-yellow-700 shadow-yellow-500/35",
    inner: "from-yellow-950 via-zinc-950 to-black",
  };
}

export function getCardTypeStyles(card: ICard): { wrapper: string; inner: string } {
  if (card.type === "ENTITY") {
    return entityCostPalette(card.cost);
  }

  if (card.type === "EXECUTION") {
    return {
      wrapper: "bg-gradient-to-br from-emerald-400 to-emerald-900 shadow-emerald-500/30",
      inner: "from-emerald-950 via-zinc-950 to-black",
    };
  }

  if (card.type === "TRAP") {
    return {
      wrapper: "bg-gradient-to-br from-violet-400 to-violet-900 shadow-violet-500/30",
      inner: "from-violet-950 via-zinc-950 to-black",
    };
  }

  if (card.type === "FUSION") {
    return {
      wrapper: "bg-gradient-to-br from-gray-100 via-slate-200 to-zinc-300 shadow-gray-900/40 border border-white/50",
      inner: "from-gray via-slate-900 to-black",
    };
  }

  return FACTION_STYLES[card.faction] ?? FACTION_STYLES.NEUTRAL;
}
