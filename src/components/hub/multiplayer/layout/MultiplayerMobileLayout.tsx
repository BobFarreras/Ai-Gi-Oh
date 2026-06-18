// src/components/hub/multiplayer/layout/MultiplayerMobileLayout.tsx - Layout móvil del lobby: stack vertical con CTA fijo, invitaciones y lista compacta.
"use client";

import { AnimatePresence } from "framer-motion";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { UserSearchInput } from "@/components/hub/internal/UserSearchInput";
import { MatchmakingPanel, MatchmakingStatus } from "./internal/MatchmakingPanel";
import { MultiplayerHeaderBar } from "./internal/MultiplayerHeaderBar";
import { InvitationBanner } from "../InvitationBanner";
import { OnlinePlayerCard } from "../OnlinePlayerCard";

interface MultiplayerMobileLayoutProps {
  onlinePlayers: IOnlinePlayer[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  pendingInvitations: IPlayerInvitation[];
  matchmakingStatus: MatchmakingStatus;
  hasDeck: boolean;
  isResponding: boolean;
  sentInvites: Set<string>;
  onToggleQueue: () => void;
  onInvite: (player: IOnlinePlayer) => void;
  onAccept: (invitation: IPlayerInvitation) => void;
  onDecline: (invitation: IPlayerInvitation) => void;
}

/**
 * Layout móvil (< 900px). Stack vertical: header compacto, CTA de combate
 * aleatorio siempre visible arriba, invitaciones y lista scrollable debajo.
 * Sin radar (caro en gama baja) — solo lista de cards memoizadas.
 */
export function MultiplayerMobileLayout({
  onlinePlayers,
  searchQuery,
  onSearchChange,
  pendingInvitations,
  matchmakingStatus,
  hasDeck,
  isResponding,
  sentInvites,
  onToggleQueue,
  onInvite,
  onAccept,
  onDecline,
}: MultiplayerMobileLayoutProps) {
  const onlineCount = onlinePlayers.length;
  const inMatchCount = onlinePlayers.filter((p) => p.status === "IN_MATCH").length;

  return (
    <div className="flex h-full flex-col gap-3">
      <MultiplayerHeaderBar onlineCount={onlineCount} inMatchCount={inMatchCount} />

      {/* CTA de combate aleatorio siempre visible */}
      <MatchmakingPanel
        status={matchmakingStatus}
        hasDeck={hasDeck}
        onToggleQueue={onToggleQueue}
      />

      {/* Banners de invitación */}
      <AnimatePresence mode="popLayout">
        {pendingInvitations.map((inv) => (
          <InvitationBanner
            key={inv.id}
            invitation={inv}
            isResponding={isResponding}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </AnimatePresence>

      {/* Lista de jugadores online scrollable */}
      <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <header className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/85">
            Duelistas en línea
          </h2>
          {onlineCount > 0 && (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
              {onlineCount}
            </span>
          )}
        </header>

        {/* Buscador de jugadores */}
        <UserSearchInput value={searchQuery} onChange={onSearchChange} placeholder="Buscar duelista…" />

        {onlineCount === 0 ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-6 text-center">
            <p className="text-sm text-slate-400">No hay otros duelistas en línea.</p>
            <p className="mt-1 text-xs text-slate-500">Invita a un amigo o usa el combate aleatorio.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {onlinePlayers.map((player) => (
                <OnlinePlayerCard
                  key={player.playerId}
                  player={player}
                  canInvite={hasDeck && player.status === "IDLE"}
                  inviteSent={sentInvites.has(player.playerId)}
                  onInvite={onInvite}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
