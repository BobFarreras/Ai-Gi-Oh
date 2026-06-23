// src/components/admin/internal/AdminAnalyticsOnlineUsers.tsx - Lista en vivo de usuarios conectados ahora mismo, vía presencia Realtime del hub (read-only).
"use client";

import { OnlinePlayerStatus } from "@/core/entities/multiplayer/IOnlinePlayer";
import { useHubPresenceReadonly } from "@/core/hooks/multiplayer/useHubPresenceReadonly";
import { OnlinePlayerStatusDot } from "@/components/hub/multiplayer/internal/OnlinePlayerStatusDot";

const STATUS_LABEL: Record<OnlinePlayerStatus, string> = {
  IDLE: "Disponible",
  IN_LOBBY: "En lobby",
  IN_MATCH: "En partida",
};

export function AdminAnalyticsOnlineUsers() {
  const players = useHubPresenceReadonly();

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
        Conectados Ahora
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] text-emerald-300">{players.length}</span>
      </h3>
      {players.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">Nadie conectado ahora mismo.</p>
      ) : (
        <ul className="space-y-1">
          {players.map((player) => (
            <li key={player.playerId} className="flex items-center gap-2 text-xs">
              <OnlinePlayerStatusDot status={player.status} />
              <span className="font-medium text-slate-200">{player.nickname}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">{STATUS_LABEL[player.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
