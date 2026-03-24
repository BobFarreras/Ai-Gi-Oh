// src/components/hub/home/HomeCardInspectorDialog.tsx - Diálogo mobile para inspección detallada de carta en Arsenal.
"use client";

import { useEffect, useState } from "react";
import { ICard } from "@/core/entities/ICard";
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
    try {
      const result = await Promise.resolve(onEvolve());
      if (!result.ok) {
        setStatusMessage({ tone: "error", text: result.message ?? "No se pudo evolucionar la carta." });
        return;
      }
      setStatusMessage({ tone: "success", text: "Evolución completada." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo evolucionar la carta.";
      setStatusMessage({ tone: "error", text: message });
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
