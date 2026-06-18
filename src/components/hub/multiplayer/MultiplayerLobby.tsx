// src/components/hub/multiplayer/MultiplayerLobby.tsx - Lobby multijugador: presencia de jugadores, emparejamiento aleatorio e invitaciones.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { useOnlinePlayers } from "@/core/hooks/multiplayer/useOnlinePlayers";
import { usePendingInvitations } from "@/core/hooks/multiplayer/usePendingInvitations";
import { useOutgoingInvitationMatch } from "@/core/hooks/multiplayer/useOutgoingInvitationMatch";
import { useMatchmakingQueue } from "@/core/hooks/multiplayer/useMatchmakingQueue";
import { sendInvitation } from "@/app/hub/multiplayer/actions/send-invitation";
import { acceptInvitation, declineInvitation } from "@/app/hub/multiplayer/actions/respond-invitation";
import { InvitationBanner } from "./InvitationBanner";
import { OnlinePlayerCard } from "./OnlinePlayerCard";

interface MultiplayerLobbyProps {
  localPlayerId: string;
  localNickname: string;
  activeDeckIds: string[];
}

export function MultiplayerLobby({ localPlayerId, localNickname, activeDeckIds }: MultiplayerLobbyProps) {
  const router = useRouter();
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const [isResponding, setIsResponding] = useState(false);

  const localPlayer: IOnlinePlayer = {
    playerId: localPlayerId,
    nickname: localNickname,
    status: "IDLE",
  };

  const { onlinePlayers } = useOnlinePlayers(localPlayer);
  const { pendingInvitations } = usePendingInvitations(localPlayerId);
  const acceptedMatchId = useOutgoingInvitationMatch(localPlayerId);
  const { status: matchmakingStatus, joinQueue, leaveQueue, matchId: matchmakingMatchId } = useMatchmakingQueue({
    localPlayerId,
    activeDeckIds,
  });

  // Redirigir al invitador cuando se acepta su invitación.
  useEffect(() => {
    if (acceptedMatchId) router.push(`/hub/multiplayer/match/${acceptedMatchId}`);
  }, [acceptedMatchId, router]);

  // Redirigir cuando el emparejamiento aleatorio encuentra una partida.
  useEffect(() => {
    if (matchmakingStatus === "matched" && matchmakingMatchId) {
      router.push(`/hub/multiplayer/match/${matchmakingMatchId}`);
    }
  }, [matchmakingStatus, matchmakingMatchId, router]);

  const handleInvite = useCallback(
    async (player: IOnlinePlayer) => {
      if (activeDeckIds.length === 0) return;
      setSentInvites((prev) => new Set(prev).add(player.playerId));
      const result = await sendInvitation(player.playerId, activeDeckIds);
      if (!result.ok) {
        setSentInvites((prev) => {
          const next = new Set(prev);
          next.delete(player.playerId);
          return next;
        });
      }
    },
    [activeDeckIds],
  );

  const handleAccept = useCallback(
    async (invitation: IPlayerInvitation) => {
      if (isResponding) return;
      setIsResponding(true);
      const result = await acceptInvitation(invitation.id, activeDeckIds);
      if (result.ok && result.matchId) {
        router.push(`/hub/multiplayer/match/${result.matchId}`);
      } else {
        setIsResponding(false);
      }
    },
    [activeDeckIds, isResponding, router],
  );

  const handleDecline = useCallback(async (invitation: IPlayerInvitation) => {
    await declineInvitation(invitation.id);
  }, []);

  const hasDeck = activeDeckIds.length > 0;
  const isWaiting = matchmakingStatus === "waiting";

  return (
    <div className="flex flex-col gap-5">
      {/* Banners de invitación entrante */}
      {pendingInvitations.map((inv) => (
        <InvitationBanner key={inv.id} invitation={inv} onAccept={handleAccept} onDecline={handleDecline} />
      ))}

      {/* Acciones principales */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Botón combate aleatorio */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={isWaiting ? leaveQueue : joinQueue}
            disabled={!hasDeck || matchmakingStatus === "matched"}
            className={`relative flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wide transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              isWaiting
                ? "border border-amber-400/50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                : "border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25"
            }`}
          >
            {isWaiting ? (
              <>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
                Buscando rival… (cancelar)
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Combate Aleatorio
              </>
            )}
          </button>
          {!hasDeck && (
            <p className="text-xs text-amber-300/80">Necesitas un mazo activo para buscar rival.</p>
          )}
        </div>

        {/* Botón ranking */}
        <Link
          href="/hub/ranking"
          className="flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/40 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700/50 hover:text-slate-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Ranking
        </Link>
      </div>

      {/* Lista de jugadores online para invitar */}
      <section>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300/85">
            Jugadores en línea
          </h2>
          {onlinePlayers.length > 0 && (
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
              {onlinePlayers.length}
            </span>
          )}
        </header>

        {onlinePlayers.length === 0 ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-6 text-center">
            <p className="text-sm text-slate-400">No hay otros duelistas en línea ahora mismo.</p>
            <p className="mt-1 text-xs text-slate-500">Invita a un amigo o usa el combate aleatorio.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {onlinePlayers.map((player) => (
              <OnlinePlayerCard
                key={player.playerId}
                player={player}
                onInvite={hasDeck ? handleInvite : undefined}
                inviteSent={sentInvites.has(player.playerId)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
