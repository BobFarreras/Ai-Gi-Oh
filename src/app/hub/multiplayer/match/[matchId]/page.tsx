// src/app/hub/multiplayer/match/[matchId]/page.tsx - Sala de partida multijugador con sincronización en tiempo real.
import { redirect, notFound } from "next/navigation";
import { MultiplayerMatchClient } from "@/components/hub/multiplayer/MultiplayerMatchClient";
import { getMatchSessionData } from "@/services/multiplayer/get-match-session-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

export default async function MultiplayerMatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const matchData = await getMatchSessionData(matchId);

  if (!matchData) redirect("/hub/multiplayer");
  if (matchData.status === "FINISHED" || matchData.status === "ABANDONED") notFound();

  if (matchData.localDeck.length === 0 || matchData.opponentDeck.length === 0) {
    redirect("/hub/multiplayer");
  }

  return (
    <MultiplayerMatchClient
      matchId={matchId}
      seed={matchData.seed}
      localPlayerId={matchData.localPlayerId}
      opponentId={matchData.opponentId}
      localNickname={matchData.localNickname}
      opponentNickname={matchData.opponentNickname}
      localDeck={matchData.localDeck}
      opponentDeck={matchData.opponentDeck}
      isPlayerA={matchData.isPlayerA}
    />
  );
}
