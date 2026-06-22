// src/components/hub/multiplayer/MultiplayerPresenceProvider.tsx - Provider hub-wide: canal único de presencia + invitaciones flotantes en cualquier sección.
"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { useHubPresence } from "@/core/hooks/multiplayer/useHubPresence";
import { usePendingInvitations } from "@/core/hooks/multiplayer/usePendingInvitations";
import { useOutgoingInvitationMatch } from "@/core/hooks/multiplayer/useOutgoingInvitationMatch";
import { acceptInvitation, declineInvitation } from "@/app/hub/multiplayer/actions/respond-invitation";
import { GlobalInvitationBannerStack } from "./GlobalInvitationBannerStack";

/**
 * Lista de jugadores conectados publicada por el canal único de presencia del
 * provider. El lobby la consume vía `useOnlinePlayersContext` en lugar de abrir su
 * propio canal: dos canales con el mismo topic sobre el socket singleton de
 * Supabase entran en conflicto y rompen la lectura de presencia.
 */
const OnlinePlayersContext = createContext<IOnlinePlayer[]>([]);

export function useOnlinePlayersContext(): IOnlinePlayer[] {
  return useContext(OnlinePlayersContext);
}

interface MultiplayerPresenceProviderProps {
  localPlayerId: string;
  localNickname: string;
  activeDeckIds: string[];
  children: ReactNode;
}

/**
 * Prefijo de rutas multijugador (lobby + partida). En estas pantallas NO se
 * muestran los banners flotantes: el lobby ya lista las invitaciones de forma
 * persistente y durante una partida no queremos interrumpir el duelo.
 */
const MULTIPLAYER_PATH_PREFIX = "/hub/multiplayer";

/**
 * Montado una vez en el layout del hub. Hace que el jugador aparezca conectado en
 * el lobby esté en la sección que esté (presencia global, un único canal compartido
 * por contexto), y reparte las invitaciones entrantes como banner flotante
 * reutilizando el diseño del lobby.
 */
export function MultiplayerPresenceProvider({
  localPlayerId,
  localNickname,
  activeDeckIds,
  children,
}: MultiplayerPresenceProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isResponding, setIsResponding] = useState(false);

  // En una partida el jugador no está disponible (IN_MATCH, no invitable). En el
  // resto del hub —lobby incluido— es IDLE para que puedan retarle. El estado se
  // re-publica al cambiar de ruta dentro de useHubPresence.
  const status: IOnlinePlayer["status"] = pathname?.startsWith(`${MULTIPLAYER_PATH_PREFIX}/match`)
    ? "IN_MATCH"
    : "IDLE";
  const localPlayer: IOnlinePlayer = { playerId: localPlayerId, nickname: localNickname, status };
  const onlinePlayers = useHubPresence(localPlayer);

  const { pendingInvitations } = usePendingInvitations(localPlayerId);
  // El invitador entra a la partida aunque haya salido del lobby a otra sección.
  const acceptedMatchId = useOutgoingInvitationMatch(localPlayerId);

  useEffect(() => {
    if (acceptedMatchId) router.push(`/hub/multiplayer/match/${acceptedMatchId}`);
  }, [acceptedMatchId, router]);

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

  const handleDecline = useCallback((invitation: IPlayerInvitation) => {
    void declineInvitation(invitation.id);
  }, []);

  // En las rutas de multijugador el lobby/partida gestionan su propia UI.
  const showFloatingBanners = !pathname?.startsWith(MULTIPLAYER_PATH_PREFIX);

  return (
    <OnlinePlayersContext.Provider value={onlinePlayers}>
      {children}
      {showFloatingBanners ? (
        <GlobalInvitationBannerStack
          invitations={pendingInvitations}
          isResponding={isResponding}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ) : null}
    </OnlinePlayersContext.Provider>
  );
}
