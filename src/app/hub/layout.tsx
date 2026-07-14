// src/app/hub/layout.tsx - Viewport fijo del hub + provider de presencia/invitaciones multijugador global.
import { MultiplayerPresenceProvider } from "@/components/hub/multiplayer/MultiplayerPresenceProvider";
import { DailyLoginGate } from "@/components/hub/progression/DailyLoginGate";
import { DailyLoginProvider } from "@/components/hub/progression/DailyLoginProvider";
import { ProgressionDock } from "@/components/hub/progression/ProgressionDock";
import { WeeklyPrizeGate } from "@/components/hub/progression/WeeklyPrizeGate";
import { getMultiplayerLobbyData } from "@/services/multiplayer/get-multiplayer-lobby-data";
import { getPendingWeeklyPrizes } from "@/services/ranking/get-pending-weekly-prizes";
import { getDailyLoginStatus } from "@/services/progression/get-daily-login-status";
import { getPlayerMissions } from "@/services/progression/get-player-missions";
import { getEventOverview } from "@/services/progression/get-event-overview";
import { getActivePromotions } from "@/services/progression/get-active-promotions";
import { getOnboardingCompleted } from "@/services/hub/get-onboarding-completed";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lobbyData, dailyLoginStatus, missions, eventOverview, promotions, onboardingCompleted, pendingWeeklyPrizes] = await Promise.all([
    getMultiplayerLobbyData(),
    getDailyLoginStatus(),
    getPlayerMissions(),
    getEventOverview(),
    getActivePromotions(),
    getOnboardingCompleted(),
    getPendingWeeklyPrizes(),
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
      {/* El dock y la recompensa diaria solo cuando el jugador ya pasó el onboarding: durante la
          narración inicial y el tutorial NO deben aparecer. Tras completar el tutorial, el
          router.refresh() re-ejecuta este layout y se montan (la diaria salta ya en el hub). */}
      {onboardingCompleted ? (
        <DailyLoginProvider initialStatus={dailyLoginStatus}>
          <DailyLoginGate />
          {/* Dentro del provider: el aviso del premio semanal espera a que se reclame la diaria para no
              apilarse encima de ella. */}
          <WeeklyPrizeGate prizes={pendingWeeklyPrizes} />
          <ProgressionDock missions={missions} eventOverview={eventOverview} promotions={promotions} />
        </DailyLoginProvider>
      ) : null}
    </MultiplayerPresenceProvider>
  );
}
