// src/components/game/board/ui/overlays/BoardStatusOverlays.tsx - Agrupa overlays de estado global del tablero: errores, acciones pendientes, pausa, fusión, cementerio y confirmaciones.
"use client";

import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IBoardUiError } from "../../hooks/internal/boardError";
import { IPendingZoneReplacement } from "../../hooks/internal/board-state/pending-replacement";
import { BattleBannerCenter } from "../BattleBannerCenter";
import { FusionCinematicLayer } from "../FusionCinematicLayer";
import { PauseOverlay } from "./PauseOverlay";
import { EntityReplacementConfirmOverlay } from "./EntityReplacementConfirmOverlay";
import { TurnAdvanceGuardOverlay } from "./TurnAdvanceGuardOverlay";
import { BoardErrorOverlay } from "./internal/BoardErrorOverlay";
import { BoardZoneBrowsers } from "./internal/BoardZoneBrowsers";
import { IFusionMaterialCandidate, FusionMaterialBrowser } from "./internal/FusionMaterialBrowser";

interface BoardStatusOverlaysProps {
  lastError: IBoardUiError | null;
  pendingActionHint: string | null;
  pendingEntityReplacement: IPendingZoneReplacement | null;
  pendingEntityReplacementTargetCard: ICard | null;
  combatLog: ICombatLogEvent[];
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  isPaused: boolean;
  onResumePause: () => void;
  onExitPause?: () => void;
  isFusionCinematicActive?: boolean;
  setIsFusionCinematicActive?: (value: boolean) => void;
  graveyardView: "player" | "opponent" | null;
  graveyardOwnerName: string;
  graveyardCards: ICard[];
  graveyardSelectableCardRefs?: string[];
  destroyedView?: "player" | "opponent" | null;
  destroyedOwnerName?: string;
  destroyedCards?: ICard[];
  onCloseError: () => void;
  onConfirmEntityReplacement: () => void;
  onCancelEntityReplacement: () => void;
  onCloseGraveyard: () => void;
  onCloseDestroyed?: () => void;
  onPreviewCard: (card: ICard) => void;
  pendingAdvanceWarning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null;
  onConfirmAdvancePhase: (disableHelp: boolean) => void;
  onCancelAdvancePhase: () => void;
  externalBannerSignal?: { id: string; left: string; right: string } | null;
  isFusionMaterialBrowserOpen?: boolean;
  fusionMaterialCandidates?: IFusionMaterialCandidate[];
  fusionSelectedCount?: number;
  onSelectFusionMaterial?: (instanceId: string) => void;
}

export function BoardStatusOverlays({
  lastError,
  pendingActionHint,
  pendingEntityReplacement,
  pendingEntityReplacementTargetCard,
  combatLog,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  isPaused,
  onResumePause,
  onExitPause,
  isFusionCinematicActive = false,
  setIsFusionCinematicActive = () => undefined,
  graveyardView,
  graveyardOwnerName,
  graveyardCards,
  graveyardSelectableCardRefs = [],
  destroyedView = null,
  destroyedOwnerName = "",
  destroyedCards = [],
  onCloseError,
  onConfirmEntityReplacement,
  onCancelEntityReplacement,
  onCloseGraveyard,
  onCloseDestroyed = () => undefined,
  onPreviewCard,
  pendingAdvanceWarning,
  onConfirmAdvancePhase,
  onCancelAdvancePhase,
  externalBannerSignal = null,
  isFusionMaterialBrowserOpen = false,
  fusionMaterialCandidates = [],
  fusionSelectedCount = 0,
  onSelectFusionMaterial = () => undefined,
}: BoardStatusOverlaysProps) {
  return (
    <>
      <BoardErrorOverlay error={lastError} onClose={onCloseError} />

      {pendingActionHint && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-130 w-[92%] max-w-3xl bg-amber-950/85 border border-amber-400/50 text-amber-100 px-5 py-3 rounded-xl shadow-[0_0_35px_rgba(251,191,36,0.25)]">
          <p className="text-xs font-black tracking-wider uppercase text-amber-300">Acción obligatoria</p>
          <p className="text-sm font-semibold">{pendingActionHint}</p>
        </div>
      )}
      {pendingEntityReplacement && pendingEntityReplacementTargetCard && (
        <EntityReplacementConfirmOverlay
          zone={pendingEntityReplacement.zone}
          targetCard={pendingEntityReplacementTargetCard}
          onConfirm={onConfirmEntityReplacement}
          onCancel={onCancelEntityReplacement}
        />
      )}

      <BattleBannerCenter
        events={combatLog}
        playerAId={playerAId}
        playerAName={playerAName}
        playerBId={playerBId}
        playerBName={playerBName}
        externalBannerSignal={externalBannerSignal}
      />
      <PauseOverlay isPaused={isPaused} onResume={onResumePause} onExit={onExitPause} />
      <TurnAdvanceGuardOverlay
        warning={pendingAdvanceWarning}
        onConfirm={onConfirmAdvancePhase}
        onCancel={onCancelAdvancePhase}
      />
      <FusionCinematicLayer
        events={combatLog}
        onActiveChange={(active) => {
          if (active !== isFusionCinematicActive) {
            setIsFusionCinematicActive(active);
          }
        }}
      />
      <FusionMaterialBrowser
        isOpen={isFusionMaterialBrowserOpen}
        candidates={fusionMaterialCandidates}
        selectedCount={fusionSelectedCount}
        onSelectMaterial={onSelectFusionMaterial}
      />
   
      <BoardZoneBrowsers
        graveyardView={graveyardView}
        graveyardOwnerName={graveyardOwnerName}
        graveyardCards={graveyardCards}
        graveyardSelectableCardRefs={graveyardSelectableCardRefs}
        destroyedView={destroyedView}
        destroyedOwnerName={destroyedOwnerName}
        destroyedCards={destroyedCards}
        onCloseGraveyard={onCloseGraveyard}
        onCloseDestroyed={onCloseDestroyed}
        onPreviewCard={onPreviewCard}
      />
    </>
  );
}
