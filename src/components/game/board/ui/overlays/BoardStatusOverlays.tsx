// src/components/game/board/ui/overlays/BoardStatusOverlays.tsx - Agrupa overlays de estado global del tablero: errores, acciones pendientes, pausa, fusión, cementerio y confirmaciones.
"use client";

import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IBoardUiError } from "../../hooks/internal/boardError";
import { IPendingZoneReplacement } from "../../hooks/internal/board-state/pending-replacement";
import { ITrapActivationPrompt } from "../../hooks/internal/board-state/useBoardUiState";
import { IBattleBannerMessage } from "../internal/banner/banner-message-policy";
import { FusionCinematicLayer } from "../FusionCinematicLayer";
import { PauseOverlay } from "./PauseOverlay";
import { TurnAdvanceGuardOverlay } from "./TurnAdvanceGuardOverlay";
import { BoardActionOverlays } from "./internal/BoardActionOverlays";
import { BoardErrorOverlay } from "./internal/BoardErrorOverlay";
import { BoardZoneBrowsers } from "./internal/BoardZoneBrowsers";
import { IFusionMaterialCandidate, FusionMaterialBrowser } from "./internal/FusionMaterialBrowser";

interface BoardStatusOverlaysProps {
  lastError: IBoardUiError | null;
  pendingActionHint: string | null;
  pendingTrapActivationPrompt?: ITrapActivationPrompt | null;
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
  fusionDeckView?: "player" | "opponent" | null;
  fusionDeckOwnerName?: string;
  fusionDeckCards?: ICard[];
  destroyedView?: "player" | "opponent" | null;
  destroyedOwnerName?: string;
  destroyedCards?: ICard[];
  onCloseError: () => void;
  onConfirmEntityReplacement: () => void;
  onCancelEntityReplacement: () => void;
  onCloseGraveyard: () => void;
  onCloseFusionDeck?: () => void;
  onCloseDestroyed?: () => void;
  onPreviewCard: (card: ICard) => void;
  pendingAdvanceWarning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null;
  onConfirmAdvancePhase: (disableHelp: boolean) => void;
  onCancelAdvancePhase: () => void;
  externalBannerSignal?: IBattleBannerMessage | null;
  showBattleBanners?: boolean;
  isFusionMaterialBrowserOpen?: boolean;
  fusionMaterialCandidates?: IFusionMaterialCandidate[];
  fusionSelectedCount?: number;
  onSelectFusionMaterial?: (instanceId: string) => void;
}

export function BoardStatusOverlays({
  lastError,
  pendingActionHint,
  pendingTrapActivationPrompt = null,
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
  fusionDeckView = null,
  fusionDeckOwnerName = "",
  fusionDeckCards = [],
  destroyedView = null,
  destroyedOwnerName = "",
  destroyedCards = [],
  onCloseError,
  onConfirmEntityReplacement,
  onCancelEntityReplacement,
  onCloseGraveyard,
  onCloseFusionDeck = () => undefined,
  onCloseDestroyed = () => undefined,
  onPreviewCard,
  pendingAdvanceWarning,
  onConfirmAdvancePhase,
  onCancelAdvancePhase,
  externalBannerSignal = null,
  showBattleBanners = true,
  isFusionMaterialBrowserOpen = false,
  fusionMaterialCandidates = [],
  fusionSelectedCount = 0,
  onSelectFusionMaterial = () => undefined,
}: BoardStatusOverlaysProps) {
  return (
    <>
      <BoardErrorOverlay error={lastError} onClose={onCloseError} />
      <BoardActionOverlays
        pendingActionHint={pendingActionHint}
        pendingTrapActivationPrompt={pendingTrapActivationPrompt}
        pendingEntityReplacement={pendingEntityReplacement}
        pendingEntityReplacementTargetCard={pendingEntityReplacementTargetCard}
        combatLog={combatLog}
        playerAId={playerAId}
        playerAName={playerAName}
        playerBId={playerBId}
        playerBName={playerBName}
        externalBannerSignal={externalBannerSignal}
        showBattleBanners={showBattleBanners}
        onConfirmEntityReplacement={onConfirmEntityReplacement}
        onCancelEntityReplacement={onCancelEntityReplacement}
      />
      <PauseOverlay isPaused={isPaused} onResume={onResumePause} onExit={onExitPause} />
      <TurnAdvanceGuardOverlay warning={pendingAdvanceWarning} onConfirm={onConfirmAdvancePhase} onCancel={onCancelAdvancePhase} />
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
        fusionDeckView={fusionDeckView}
        fusionDeckOwnerName={fusionDeckOwnerName}
        fusionDeckCards={fusionDeckCards}
        destroyedView={destroyedView}
        destroyedOwnerName={destroyedOwnerName}
        destroyedCards={destroyedCards}
        onCloseGraveyard={onCloseGraveyard}
        onCloseFusionDeck={onCloseFusionDeck}
        onCloseDestroyed={onCloseDestroyed}
        onPreviewCard={onPreviewCard}
      />
    </>
  );
}
