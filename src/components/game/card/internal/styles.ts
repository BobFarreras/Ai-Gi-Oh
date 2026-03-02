import { Faction } from "@/core/entities/ICard";

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
