// src/components/hub/multiplayer/MultiplayerLobby.tsx - Orquestador del lobby: estado, hooks de realtime y selección de layout desktop/mobile.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { useOnlinePlayers } from "@/core/hooks/multiplayer/useOnlinePlayers";
import { usePendingInvitations } from "@/core/hooks/multiplayer/usePendingInvitations";
import { useOutgoingInvitationMatch } from "@/core/hooks/multiplayer/useOutgoingInvitationMatch";
import { useMatchmakingQueue } from "@/core/hooks/multiplayer/useMatchmakingQueue";
import { sendInvitation } from "@/app/hub/multiplayer/actions/send-invitation";
import { acceptInvitation, declineInvitation } from "@/app/hub/multiplayer/actions/respond-invitation";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { useFilteredPlayers } from "@/components/hub/internal/use-filtered-players";
import { isDesktopLayoutViewport } from "@/components/internal/layout-breakpoints";
import { useMultiplayerLobbySfx } from "./internal/use-multiplayer-lobby-sfx";
import { MultiplayerDesktopLayout } from "./layout/MultiplayerDesktopLayout";
import { MultiplayerMobileLayout } from "./layout/MultiplayerMobileLayout";

interface MultiplayerLobbyProps {
  localPlayerId: string;
  localNickname: string;
  activeDeckIds: string[];
}

export function MultiplayerLobby({ localPlayerId, localNickname, activeDeckIds }: MultiplayerLobbyProps) {
  const router = useRouter();
  const viewportWidth = useViewportWidth();
  const isDesktop = isDesktopLayoutViewport(viewportWidth);
  const { play } = useMultiplayerLobbySfx();

  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const [isResponding, setIsResponding] = useState(false);

  const localPlayer: IOnlinePlayer = {
    playerId: localPlayerId,
    nickname: localNickname,
    status: "IDLE",
  };

  const { onlinePlayers } = useOnlinePlayers(localPlayer);
  // Buscador de jugadores: filtra la lista de online por nickname.
  const { query: searchQuery, setQuery: setSearchQuery, filtered: filteredPlayers } = useFilteredPlayers(onlinePlayers);
  const { pendingInvitations } = usePendingInvitations(localPlayerId);
  const acceptedMatchId = useOutgoingInvitationMatch(localPlayerId);
  const { status: matchmakingStatus, joinQueue, leaveQueue, matchId: matchmakingMatchId } = useMatchmakingQueue({
    localPlayerId,
    activeDeckIds,
  });

  // SFX cuando llega una invitación nueva (compara con la anterior)
  const prevInvitationsCountRef = useRef(0);
  useEffect(() => {
    if (pendingInvitations.length > prevInvitationsCountRef.current) {
      play("INVITATION_RECEIVED");
    }
    prevInvitationsCountRef.current = pendingInvitations.length;
  }, [pendingInvitations.length, play]);

  // Redirigir al invitador cuando se acepta su invitación.
  useEffect(() => {
    if (acceptedMatchId) router.push(`/hub/multiplayer/match/${acceptedMatchId}`);
  }, [acceptedMatchId, router]);

  // Redirigir cuando el emparejamiento aleatorio encuentra partida + SFX.
  useEffect(() => {
    if (matchmakingStatus === "matched" && matchmakingMatchId) {
      play("MATCH_FOUND");
      router.push(`/hub/multiplayer/match/${matchmakingMatchId}`);
    }
  }, [matchmakingStatus, matchmakingMatchId, router, play]);

  const handleInvite = useCallback(
    async (player: IOnlinePlayer) => {
      if (activeDeckIds.length === 0) return;
      setSentInvites((prev) => new Set(prev).add(player.playerId));
      play("INVITE_SENT");
      const result = await sendInvitation(player.playerId, activeDeckIds);
      if (!result.ok) {
        setSentInvites((prev) => {
          const next = new Set(prev);
          next.delete(player.playerId);
          return next;
        });
        play("ERROR");
      }
    },
    [activeDeckIds, play],
  );

  const handleAccept = useCallback(
    async (invitation: IPlayerInvitation) => {
      if (isResponding) return;
      setIsResponding(true);
      play("INVITATION_ACCEPTED");
      const result = await acceptInvitation(invitation.id, activeDeckIds);
      if (result.ok && result.matchId) {
        router.push(`/hub/multiplayer/match/${result.matchId}`);
      } else {
        setIsResponding(false);
        play("ERROR");
      }
    },
    [activeDeckIds, isResponding, router, play],
  );

  const handleDecline = useCallback(
    (invitation: IPlayerInvitation) => {
      play("INVITATION_DECLINED");
      void declineInvitation(invitation.id);
    },
    [play],
  );

  const handleToggleQueue = useCallback(() => {
    if (matchmakingStatus === "waiting") {
      void leaveQueue();
    } else if (matchmakingStatus === "idle") {
      void joinQueue();
    }
  }, [matchmakingStatus, joinQueue, leaveQueue]);

  const hasDeck = activeDeckIds.length > 0;

  const sharedProps = {
    onlinePlayers: filteredPlayers,
    searchQuery,
    onSearchChange: setSearchQuery,
    pendingInvitations,
    matchmakingStatus,
    hasDeck,
    isResponding,
    sentInvites,
    onToggleQueue: handleToggleQueue,
    onInvite: handleInvite,
    onAccept: handleAccept,
    onDecline: handleDecline,
  };

  return isDesktop ? (
    <MultiplayerDesktopLayout
      {...sharedProps}
      localPlayerId={localPlayerId}
      localNickname={localNickname}
    />
  ) : (
    <MultiplayerMobileLayout {...sharedProps} />
  );
}
