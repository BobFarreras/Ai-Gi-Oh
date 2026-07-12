// src/app/hub/ranking/page.tsx - Ranking con selector entre tres tableros (multijugador ELO, actividad y
// comercial) y transición animada de posiciones. Ver docs/features/ranking-selector-design.md.
import { RankingScene } from "@/components/hub/ranking/RankingScene";
import { RankingHubClient } from "@/components/hub/ranking/RankingHubClient";
import { getRankingBoards } from "@/services/ranking/get-ranking-boards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RankingPage() {
  const data = await getRankingBoards();
  return (
    <RankingScene>
      <RankingHubClient data={data} />
    </RankingScene>
  );
}
