// src/app/hub/layout.tsx - Viewport fijo del hub + provider de presencia/invitaciones multijugador global.
import { MultiplayerPresenceProvider } from "@/components/hub/multiplayer/MultiplayerPresenceProvider";
import { DailyLoginGate } from "@/components/hub/progression/DailyLoginGate";
import { ProgressionDock } from "@/components/hub/progression/ProgressionDock";
import { getMultiplayerLobbyData } from "@/services/multiplayer/get-multiplayer-lobby-data";
import { getDailyLoginStatus } from "@/services/progression/get-daily-login-status";
import { getPlayerMissions } from "@/services/progression/get-player-missions";
import { getEventOverview } from "@/services/progression/get-event-overview";
import { getActivePromotions } from "@/services/progression/get-active-promotions";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lobbyData, dailyLoginStatus, missions, eventOverview, promotions] = await Promise.all([
    getMultiplayerLobbyData(),
    getDailyLoginStatus(),
    getPlayerMissions(),
    getEventOverview(),
    getActivePromotions(),
  ]);
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
      {dailyLoginStatus ? <DailyLoginGate status={dailyLoginStatus} /> : null}
      <ProgressionDock missions={missions} eventOverview={eventOverview} promotions={promotions} />
    </MultiplayerPresenceProvider>
  );
}
