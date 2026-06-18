// src/components/hub/multiplayer/layout/MultiplayerDesktopLayout.tsx - Layout desktop del lobby: radar de presencia a la izq, lista de duelistas a la der.
"use client";

import { AnimatePresence } from "framer-motion";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { MatchmakingPanel, MatchmakingStatus } from "./internal/MatchmakingPanel";
import { MultiplayerHeaderBar } from "./internal/MultiplayerHeaderBar";
import { PresenceRadar } from "./internal/PresenceRadar";
import { InvitationBanner } from "../InvitationBanner";
import { OnlinePlayerCard } from "../OnlinePlayerCard";

interface MultiplayerDesktopLayoutProps {
  onlinePlayers: IOnlinePlayer[];
  pendingInvitations: IPlayerInvitation[];
  localPlayerId: string;
  localNickname: string;
  matchmakingStatus: MatchmakingStatus;
  hasDeck: boolean;
  isResponding: boolean;
  sentInvites: Set<string>;
  onToggleQueue: () => void;
  onInvite: (player: IOnlinePlayer) => void;
  onAccept: (invitation: IPlayerInvitation) => void;
  onDecline: (invitation: IPlayerInvitation) => void;
  onSelectRadarPlayer?: (player: IOnlinePlayer) => void;
}

/**
 * Layout desktop (>= 900px). 2 columnas: presencia + acciones a la izq,
 * invitaciones y lista de duelistas a la der. Las animaciones de entrada/salida
 * de banners y cards usan AnimatePresence + transform (GPU-friendly).
 */
export function MultiplayerDesktopLayout({
  onlinePlayers,
  pendingInvitations,
  localPlayerId,
  localNickname,
  matchmakingStatus,
  hasDeck,
  isResponding,
  sentInvites,
  onToggleQueue,
  onInvite,
  onAccept,
  onDecline,
  onSelectRadarPlayer,
}: MultiplayerDesktopLayoutProps) {
  const onlineCount = onlinePlayers.length;
  const inMatchCount = onlinePlayers.filter((p) => p.status === "IN_MATCH").length;

  return (
    <div className="flex h-full flex-col gap-3">
      <MultiplayerHeaderBar onlineCount={onlineCount} inMatchCount={inMatchCount} />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(340px,0.85fr)_1.15fr] gap-3">
        {/* Columna izquierda: radar + matchmaking */}
        <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-cyan-900/40 bg-[#041120]/60 p-4 backdrop-blur-sm">
          <div className="flex flex-1 items-center justify-center">
            <PresenceRadar
              players={onlinePlayers}
              localNickname={localNickname}
              localPlayerId={localPlayerId}
              onSelectPlayer={onSelectRadarPlayer}
            />
          </div>
          <MatchmakingPanel
            status={matchmakingStatus}
            hasDeck={hasDeck}
            onToggleQueue={onToggleQueue}
          />
        </aside>

        {/* Columna derecha: invitaciones + lista */}
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          {/* Banners de invitación entrante */}
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

          {/* Lista de jugadores online */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-700/50 bg-slate-900/40 p-3">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/85">
                Duelistas en línea
              </h2>
              {onlineCount > 0 && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  {onlineCount}
                </span>
              )}
            </header>

            <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto pr-1">
              {onlineCount === 0 ? (
                <EmptyPlayersState />
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
        </section>
      </div>
    </div>
  );
}

function EmptyPlayersState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-8 text-center">
      <p className="text-sm text-slate-400">No hay otros duelistas en línea.</p>
      <p className="text-xs text-slate-500">Invita a un amigo o usa el combate aleatorio.</p>
    </div>
  );
}
