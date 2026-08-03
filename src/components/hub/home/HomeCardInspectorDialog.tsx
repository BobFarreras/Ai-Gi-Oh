// src/components/hub/home/HomeCardInspectorDialog.tsx - Diálogo mobile para inspección detallada de carta en Arsenal.
"use client";

import { ICard } from "@/core/entities/ICard";
import { ICardUpgradeCounts } from "@/components/game/card/internal/card-frame-types";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeInspectorActionButtons } from "@/components/hub/home/HomeInspectorActionButtons";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { IInspectorOrigin } from "@/components/hub/internal/mobile-inspector-animation";
import { MobileInspectorDialogShell } from "@/components/hub/internal/MobileInspectorDialogShell";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";
import { HomeInspectorStatusMessage } from "@/components/hub/home/internal/view/HomeInspectorStatusMessage";
import { useHomeInspectorActions } from "@/components/hub/home/internal/hooks/use-home-inspector-actions";

interface HomeCardInspectorDialogProps {
  isOpen: boolean;
  origin: IInspectorOrigin;
  selectedCard: ICard | null;
  selectedCardVersionTier: number;
  selectedCardLevel: number;
  selectedCardXp: number;
  selectedCardMasteryPassiveSkillId: string | null;
  selectedCardSource: "DECK" | "COLLECTION" | "NONE";
  canInsert: boolean;
  canRemove: boolean;
  canEvolve: boolean;
  evolveCost: number | null;
  onInsert: () => Promise<IHomeActionResult>;
  onRemove: () => Promise<IHomeActionResult>;
  onEvolve: () => Promise<IHomeActionResult>;
  onEquip?: () => void;
  equipPendingObjectLabel?: string | null;
  upgradeCounts?: ICardUpgradeCounts | null;
  onClose: () => void;
  isTutorialActionStep?: boolean;
  tutorialHighlightTargetId?: string | null;
}

export function HomeCardInspectorDialog({
  isOpen,
  origin,
  selectedCard,
  selectedCardVersionTier,
  selectedCardLevel,
  selectedCardXp,
  selectedCardMasteryPassiveSkillId,
  selectedCardSource,
  canInsert,
  canRemove,
  canEvolve,
  evolveCost,
  onInsert,
  onRemove,
  onEvolve,
  onEquip,
  equipPendingObjectLabel = null,
  upgradeCounts = null,
  onClose,
  isTutorialActionStep = false,
  tutorialHighlightTargetId = null,
}: HomeCardInspectorDialogProps) {
  const { pendingAction, statusMessage, handleInsert, handleRemove, handleEvolve } = useHomeInspectorActions({
    onInsert,
    onRemove,
    onEvolve,
    onClose,
  });
  const { play } = useHubModuleSfx();
  const handleRequestClose = (source: "overlay" | "button") => {
    if (source === "button") play("DIALOG_CLOSE");
  };
  return (
    <MobileInspectorDialogShell
      isOpen={isOpen}
      origin={origin}
      onClose={onClose}
      onRequestClose={handleRequestClose}
      closeAriaLabel="Cerrar inspección de carta"
      overlayTopClassName="top-[80px]"
      panelTopClassName="top-[88px] max-h-[calc(100dvh-96px)]"
      zIndexClassName={isTutorialActionStep ? "z-[426]" : "z-[220]"}
      overlayTintClassName={isTutorialActionStep ? "bg-transparent" : "bg-black/52"}
      isDismissDisabled={pendingAction !== null}
    >
      <div className="flex h-full min-h-0 flex-col">
        <HomeCardInspector
          selectedCard={selectedCard}
          selectedCardVersionTier={selectedCardVersionTier}
          selectedCardLevel={selectedCardLevel}
          selectedCardXp={selectedCardXp}
          selectedCardMasteryPassiveSkillId={selectedCardMasteryPassiveSkillId}
          onEquip={onEquip ? () => { onClose(); onEquip(); } : undefined}
          equipPendingObjectLabel={equipPendingObjectLabel}
          upgradeCounts={upgradeCounts}
        />
        <HomeInspectorActionButtons
          source={selectedCardSource}
          canInsert={canInsert}
          canRemove={canRemove}
          canEvolve={canEvolve}
          evolveCost={evolveCost}
          pendingAction={pendingAction}
          onInsert={handleInsert}
          onRemove={handleRemove}
          onEvolve={handleEvolve}
          tutorialHighlightTargetId={tutorialHighlightTargetId}
        />
        <HomeInspectorStatusMessage statusMessage={statusMessage} />
      </div>
    </MobileInspectorDialogShell>
  );
}
