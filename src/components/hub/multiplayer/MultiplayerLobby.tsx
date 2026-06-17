// src/components/hub/multiplayer/MultiplayerLobby.tsx - Lobby multijugador: presencia de jugadores, invitaciones y acceso a partidas.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { useOnlinePlayers } from "@/core/hooks/multiplayer/useOnlinePlayers";
import { usePendingInvitations } from "@/core/hooks/multiplayer/usePendingInvitations";
import { useOutgoingInvitationMatch } from "@/core/hooks/multiplayer/useOutgoingInvitationMatch";
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

  // El invitador entra a la partida en cuanto el rival acepta.
  useEffect(() => {
    if (acceptedMatchId) {
      router.push(`/hub/multiplayer/match/${acceptedMatchId}`);
    }
  }, [acceptedMatchId, router]);

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

  const handleDecline = useCallback(
    async (invitation: IPlayerInvitation) => {
      await declineInvitation(invitation.id);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      {pendingInvitations.map((inv) => (
        <InvitationBanner
          key={inv.id}
          invitation={inv}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}

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
            <p className="mt-1 text-xs text-slate-500">Invita a un amigo y conéctate juntos.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {onlinePlayers.map((player) => (
              <OnlinePlayerCard
                key={player.playerId}
                player={player}
                onInvite={activeDeckIds.length > 0 ? handleInvite : undefined}
                inviteSent={sentInvites.has(player.playerId)}
              />
            ))}
          </div>
        )}

        {activeDeckIds.length === 0 && (
          <p className="mt-3 text-xs text-amber-300/80">
            Necesitas un mazo activo para poder invitar a otros jugadores.
          </p>
        )}
      </section>
    </div>
  );
}
