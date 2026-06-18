// src/components/hub/multiplayer/OnlinePlayerCard.tsx - Tarjeta memoizada de jugador online con avatar generado, glow por estado y CTA de invitación.
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { OnlinePlayerStatusDot } from "./internal/OnlinePlayerStatusDot";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { areEqualOnlinePlayerProps } from "./internal/multiplayer-lobby-equality";

const STATUS_LABEL: Record<IOnlinePlayer["status"], string> = {
  IDLE: "Disponible",
  IN_LOBBY: "En lobby",
  IN_MATCH: "En duelo",
};

interface OnlinePlayerCardProps {
  player: IOnlinePlayer;
  canInvite: boolean;
  inviteSent: boolean;
  onInvite?: (player: IOnlinePlayer) => void;
}

/**
 * Tarjeta de jugador online. Memoizada por contenido (no por referencia): el
 * motor de presencia recrea objetos en cada sync, así que comparamos solo los
 * campos que afectan al render. Animaciones de entrada vía framer-motion con
 * transform (GPU-friendly).
 */
function OnlinePlayerCardComponent({ player, canInvite, inviteSent, onInvite }: OnlinePlayerCardProps) {
  const { from, to } = getAvatarGradientClasses(player.playerId);
  const initial = getAvatarInitial(player.nickname);
  const showInviteButton = canInvite && Boolean(onInvite);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 transition-colors hover:border-cyan-500/40 hover:bg-slate-800/70"
    >
      {/* Glow lateral sutil al hover (gradiente radial, no filter blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400/0 via-cyan-400/0 to-cyan-400/0 transition-colors duration-300 group-hover:from-cyan-400/60 group-hover:via-cyan-400/30 group-hover:to-cyan-400/60"
      />

      <div className="flex min-w-0 items-center gap-2.5">
        {/* Avatar generado con gradiente determinista por playerId */}
        <div
          aria-hidden
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${from} ${to} text-sm font-black text-white shadow-[inset_0_0_8px_rgba(0,0,0,0.4)]`}
        >
          {initial}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-slate-100">{player.nickname}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            <OnlinePlayerStatusDot status={player.status} size={6} />
            {STATUS_LABEL[player.status]}
          </span>
        </div>
      </div>

      {showInviteButton && (
        <button
          type="button"
          onClick={() => onInvite?.(player)}
          disabled={inviteSent}
          aria-label={`Invitar a ${player.nickname} a un duelo`}
          className="shrink-0 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-400/25 hover:shadow-[0_0_12px_rgba(34,211,238,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          {inviteSent ? "Enviada" : "Invitar"}
        </button>
      )}
    </motion.div>
  );
}

export const OnlinePlayerCard = memo(OnlinePlayerCardComponent, areEqualOnlinePlayerProps);
