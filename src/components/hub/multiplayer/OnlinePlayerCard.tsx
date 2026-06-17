// src/components/hub/multiplayer/OnlinePlayerCard.tsx - Tarjeta de jugador online con indicador de estado e invitación.
"use client";

import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";

const STATUS_LABELS: Record<IOnlinePlayer["status"], string> = {
  IDLE: "Disponible",
  IN_LOBBY: "En lobby",
  IN_MATCH: "En duelo",
};

const STATUS_DOT: Record<IOnlinePlayer["status"], string> = {
  IDLE: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]",
  IN_LOBBY: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]",
  IN_MATCH: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]",
};

interface OnlinePlayerCardProps {
  player: IOnlinePlayer;
  onInvite?: (player: IOnlinePlayer) => void;
  inviteSent?: boolean;
}

export function OnlinePlayerCard({ player, onInvite, inviteSent }: OnlinePlayerCardProps) {
  const canInvite = player.status === "IDLE" && Boolean(onInvite);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 transition-colors hover:border-cyan-500/30 hover:bg-slate-800/60">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[player.status]}`} aria-hidden />
        <span className="truncate text-sm font-bold text-slate-100">{player.nickname}</span>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {STATUS_LABELS[player.status]}
        </span>
      </div>

      {canInvite && (
        <button
          type="button"
          onClick={() => onInvite?.(player)}
          disabled={inviteSent}
          className="shrink-0 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-cyan-200 transition hover:bg-cyan-400/20 disabled:pointer-events-none disabled:opacity-50"
        >
          {inviteSent ? "Enviada" : "Invitar"}
        </button>
      )}
    </div>
  );
}
