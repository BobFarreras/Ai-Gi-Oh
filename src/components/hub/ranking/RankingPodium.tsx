// src/components/hub/ranking/RankingPodium.tsx - Podio holográfico escalonado para el top 3 del ranking con glow por tier.
"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { getPodiumStyle, PodiumTier } from "./internal/tier";

interface RankingPodiumProps {
  /** Slots [plata, oro, bronce]; null si hay menos de 3 clasificados. */
  podium: Array<IRankingEntry | null>;
  localPlayerId: string | null;
}

/** Orden visual de slots con su tier y altura relativa (desktop horizontal). */
const SLOT_CONFIG: ReadonlyArray<{ tier: PodiumTier; heightClass: string; orderClass: string }> = [
  { tier: "silver", heightClass: "h-[82%]", orderClass: "order-1" },
  { tier: "gold", heightClass: "h-full", orderClass: "order-2" },
  { tier: "bronze", heightClass: "h-[70%]", orderClass: "order-3" },
];

/** Renderiza un slot individual del podio (avatar, nickname, ELO, V/D). */
function PodiumSlot({
  entry,
  tier,
  isLocal,
}: {
  entry: IRankingEntry | null;
  tier: PodiumTier;
  isLocal: boolean;
}) {
  const style = getPodiumStyle(tier);

  if (!entry) {
    // Slot vacío: mantiene la silueta del podio sin jugador.
    return (
      <div className="flex h-full flex-col items-center justify-end" aria-hidden>
        <div className={`w-full rounded-t-xl border border-dashed ${style.border} bg-slate-900/30 opacity-40`} style={{ height: "60%" }} />
      </div>
    );
  }

  const avatar = getAvatarGradientClasses(entry.playerId);
  const initial = getAvatarInitial(entry.nickname);
  const totalGames = entry.wins + entry.losses;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`flex h-full w-full flex-col items-center justify-end rounded-t-xl border ${style.border} ${style.glow} bg-[#020a14]/70 p-3 backdrop-blur-sm`}
    >
      {/* Avatar grande con glow por tier */}
      <div className={`relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 ${style.border} ${style.glow} sm:h-20 sm:w-20`}>
        {entry.avatarUrl ? (
          <Image src={entry.avatarUrl} alt={entry.nickname} fill sizes="80px" className="object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatar.from} ${avatar.to} text-2xl font-black text-white`}>
            {initial}
          </div>
        )}
      </div>

      <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>{style.label}</span>
      <span className="mt-0.5 max-w-full truncate text-sm font-black text-slate-100">{entry.nickname}{isLocal && <span className="ml-1 text-[10px] text-cyan-400">(tú)</span>}</span>

      {/* ELO destacado */}
      <span className={`mt-1 text-2xl font-black tabular-nums ${style.text} sm:text-3xl`}>{entry.eloRating}</span>

      {/* V/D compacto */}
      <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-400">
        <span className="text-emerald-400">{entry.wins}V</span>
        {" · "}
        <span className="text-rose-400">{entry.losses}D</span>
        {totalGames > 0 && <span className="ml-1 text-slate-500">({Math.round((entry.wins / totalGames) * 100)}%)</span>}
      </span>
    </motion.div>
  );
}

function RankingPodiumComponent({ podium, localPlayerId }: RankingPodiumProps) {
  return (
    <div className="grid h-full grid-cols-3 items-end gap-2 sm:gap-4">
      {SLOT_CONFIG.map((slot, index) => {
        const entry = podium[index] ?? null;
        const isLocal = entry !== null && entry.playerId === localPlayerId;
        return (
          <div key={slot.tier} className={`flex h-full items-end ${slot.orderClass}`}>
            <div className={slot.heightClass + " w-full"}>
              <PodiumSlot entry={entry} tier={slot.tier} isLocal={isLocal} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const RankingPodium = memo(RankingPodiumComponent);
