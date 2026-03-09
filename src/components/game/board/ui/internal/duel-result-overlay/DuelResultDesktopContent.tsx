// src/components/game/board/ui/internal/duel-result-overlay/DuelResultDesktopContent.tsx - Layout desktop del overlay con recompensas y lista de progreso.
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { ICard } from "@/core/entities/ICard";
import { DuelResultCardDensity } from "@/components/game/board/ui/internal/duel-result/duel-result-card-density";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { DuelResultRewardsPanel } from "@/components/game/board/ui/internal/duel-result/DuelResultRewardsPanel";
import { DuelResultActionButton } from "@/components/game/board/ui/internal/duel-result-overlay/DuelResultActionButton";
import { DuelResultExperienceContent } from "@/components/game/board/ui/internal/duel-result-overlay/DuelResultExperienceContent";

interface IDuelResultDesktopContentProps {
  rewardSummary?: IDuelResultRewardSummary | null;
  isGiftOpen: boolean;
  onToggleGift: () => void;
  actionLabel: string;
  onAction: () => void;
  isBattleExperiencePending: boolean;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  cardDensity: DuelResultCardDensity;
}

export function DuelResultDesktopContent({
  rewardSummary,
  isGiftOpen,
  onToggleGift,
  actionLabel,
  onAction,
  isBattleExperiencePending,
  battleExperienceSummary,
  battleExperienceCardLookup,
  cardDensity,
}: IDuelResultDesktopContentProps) {
  return (
    <>
      <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-4">
        {rewardSummary && <DuelResultRewardsPanel rewardSummary={rewardSummary} isGiftOpen={isGiftOpen} onToggleGift={onToggleGift} />}
        <DuelResultActionButton
          label={actionLabel}
          onClick={onAction}
          className="group relative w-full mt-auto py-4 bg-cyan-950/80 border border-cyan-400/60 text-cyan-50 font-black uppercase tracking-[0.2em] text-sm rounded-xl hover:bg-cyan-900 transition-all overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
        />
      </div>
      <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-cyan-900/50 bg-black/40 p-4 sm:p-6 shadow-inner relative overflow-hidden">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Rendimiento del Escuadrón</p>
        <DuelResultExperienceContent
          battleExperienceSummary={battleExperienceSummary}
          battleExperienceCardLookup={battleExperienceCardLookup}
          isBattleExperiencePending={isBattleExperiencePending}
          density={cardDensity}
          emptyLabelClassName="text-sm uppercase tracking-widest text-zinc-500"
          gridClassName="flex flex-wrap justify-center sm:justify-start content-start gap-4 pb-4"
          wrapperClassName="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-2"
        />
      </div>
    </>
  );
}

