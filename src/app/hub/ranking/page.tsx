// src/app/hub/ranking/page.tsx - Tabla de clasificación global de jugadores por ELO con podio holográfico.
import { RankingScene } from "@/components/hub/ranking/RankingScene";
import { RankingClient } from "@/components/hub/ranking/RankingClient";
import { getRankingData } from "@/services/ranking/get-ranking-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RankingPage() {
  const { entries, localPlayerId, localPlayerRank } = await getRankingData();

  return (
    <RankingScene>
      <RankingClient
        entries={entries}
        localPlayerId={localPlayerId}
        localPlayerRank={localPlayerRank}
      />
    </RankingScene>
  );
}
