// src/components/hub/home/HomeCardInspectorDialog.tsx - Diálogo mobile para inspección detallada de carta en Arsenal.
"use client";

import { useEffect, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { ICardUpgradeCounts } from "@/components/game/card/internal/card-frame-types";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeInspectorActionButtons } from "@/components/hub/home/HomeInspectorActionButtons";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { IInspectorOrigin } from "@/components/hub/internal/mobile-inspector-animation";
import { MobileInspectorDialogShell } from "@/components/hub/internal/MobileInspectorDialogShell";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";
import { HomeInspectorStatusMessage } from "@/components/hub/home/internal/view/HomeInspectorStatusMessage";

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
  const [pendingAction, setPendingAction] = useState<"INSERT" | "REMOVE" | "EVOLVE" | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const { play } = useHubModuleSfx();
  const handleRequestClose = (source: "overlay" | "button") => {
    if (source === "button") play("DIALOG_CLOSE");
  };
  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), statusMessage.tone === "error" ? 2600 : 1400);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);
  const handleInsert = async () => {
    if (pendingAction) return;
    setPendingAction("INSERT");
    try {
      const result = await Promise.resolve(onInsert());
      if (!result.ok) {
        setStatusMessage({ tone: "error", text: result.message ?? "No se pudo añadir la carta." });
        return;
      }
      setStatusMessage({ tone: "success", text: "Carta añadida al deck." });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo añadir la carta.";
      setStatusMessage({ tone: "error", text: message });
    } finally {
      setPendingAction(null);
    }
  };
  const handleRemove = async () => {
    if (pendingAction) return;
    setPendingAction("REMOVE");
    try {
      onClose();
      await Promise.resolve(onRemove());
    } finally {
      setPendingAction(null);
    }
  };
  const handleEvolve = async () => {
    if (pendingAction) return;
    setPendingAction("EVOLVE");
    // Cerrar el inspector para que la cinemática de evolución (overlay a pantalla completa) se vea en
    // móvil sin quedar tapada por este diálogo modal. Los fallos se muestran vía el diálogo de error de
    // la escena (HubErrorDialog, alimentado por handleHomeEvolveSelectedCard), así que no se pierde feedback.
    onClose();
    try {
      await Promise.resolve(onEvolve());
    } finally {
      setPendingAction(null);
    }
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
