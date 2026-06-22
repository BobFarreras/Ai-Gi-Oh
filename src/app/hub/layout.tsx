// src/app/hub/layout.tsx - Viewport fijo del hub + provider de presencia/invitaciones multijugador global.
import { MultiplayerPresenceProvider } from "@/components/hub/multiplayer/MultiplayerPresenceProvider";
import { getMultiplayerLobbyData } from "@/services/multiplayer/get-multiplayer-lobby-data";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lobbyData = await getMultiplayerLobbyData();
  const viewport = <div className="relative min-h-dvh overflow-hidden">{children}</div>;

  // Sin sesión (p. ej. flujos de auth) no montamos presencia ni invitaciones.
  if (!lobbyData) return viewport;

  return (
    <MultiplayerPresenceProvider
      localPlayerId={lobbyData.playerId}
      localNickname={lobbyData.nickname}
      activeDeckIds={lobbyData.activeDeckIds}
    >
      {viewport}
    </MultiplayerPresenceProvider>
  );
}
