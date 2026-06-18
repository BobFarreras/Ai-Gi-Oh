// src/components/hub/ranking/RankingClient.tsx - Orquestador cliente del ranking: header + podio + lista con layout responsivo.
"use client";

import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { isDesktopLayoutViewport } from "@/components/internal/layout-breakpoints";
import { splitPodiumAndRest } from "./internal/tier";
import { RankingHeaderBar } from "./layout/RankingHeaderBar";
import { RankingPodium } from "./RankingPodium";
import { RankingList } from "./RankingList";

interface RankingClientProps {
  entries: IRankingEntry[];
  localPlayerId: string | null;
  localPlayerRank: number | null;
}

/**
 * Orquesta la composición del ranking. El layout se adapta por viewport: en
 * desktop el podio tiene más altura; en móvil se compacta. Sin estado de
 * realtime (los datos vienen del servidor en cada navegación).
 */
export function RankingClient({ entries, localPlayerId, localPlayerRank }: RankingClientProps) {
  const viewportWidth = useViewportWidth();
  const isDesktop = isDesktopLayoutViewport(viewportWidth);
  const { podium, rest } = splitPodiumAndRest(entries);

  const topElo = entries.length > 0 ? entries[0].eloRating : null;
  const podiumHeightClass = isDesktop ? "h-[40%] min-h-[220px]" : "h-[34%] min-h-[180px]";

  return (
    <div className="flex h-full flex-col gap-3">
      <RankingHeaderBar
        totalDuelists={entries.length}
        topElo={topElo}
        localPlayerRank={localPlayerRank}
      />

      {/* Podio del top 3 */}
      <div className={podiumHeightClass}>
        <RankingPodium podium={podium} localPlayerId={localPlayerId} />
      </div>

      {/* Lista del resto (rank 4+) */}
      <RankingList entries={rest} localPlayerId={localPlayerId} />
    </div>
  );
}
