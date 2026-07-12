// src/app/hub/ranking/weekly/page.tsx - Rankings semanales (actividad + comercial) con premios los domingos.
import { RankingScene } from "@/components/hub/ranking/RankingScene";
import { WeeklyLeaderboardsClient } from "@/components/hub/ranking/WeeklyLeaderboardsClient";
import { getWeeklyLeaderboards } from "@/services/ranking/get-weekly-leaderboards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WeeklyLeaderboardsPage() {
  const data = await getWeeklyLeaderboards();
  return (
    <RankingScene>
      <WeeklyLeaderboardsClient data={data} />
    </RankingScene>
  );
}
