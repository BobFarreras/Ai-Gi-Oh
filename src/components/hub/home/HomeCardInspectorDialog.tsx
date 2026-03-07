// src/components/hub/home/HomeCardInspectorDialog.tsx - Diálogo mobile para inspección detallada de carta en Arsenal.
"use client";

import { useEffect, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeInspectorActionButtons } from "@/components/hub/home/HomeInspectorActionButtons";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { IInspectorOrigin } from "@/components/hub/internal/mobile-inspector-animation";
import { MobileInspectorDialogShell } from "@/components/hub/internal/MobileInspectorDialogShell";

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
  onInsert: () => void;
  onRemove: () => void;
  onEvolve: () => void;
  onClose: () => void;
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
}: HomeCardInspectorDialogProps) {
  const [pendingAction, setPendingAction] = useState<"INSERT" | "REMOVE" | "EVOLVE" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { play } = useHubModuleSfx();
  const handleClose = () => {
    play("INSPECTOR_CLOSE");
    onClose();
  };
  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 1400);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);
  const handleInsert = async () => {
    if (pendingAction) return;
    setPendingAction("INSERT");
    try {
      play("ADD_CARD");
      await Promise.resolve(onInsert());
      setStatusMessage("Carta añadida al deck.");
      handleClose();
    } finally {
      setPendingAction(null);
    }
  };
  const handleRemove = async () => {
    if (pendingAction) return;
    setPendingAction("REMOVE");
    try {
      play("REMOVE_CARD");
      await Promise.resolve(onRemove());
      setStatusMessage("Carta removida del deck.");
      handleClose();
    } finally {
      setPendingAction(null);
    }
  };
  const handleEvolve = async () => {
    if (pendingAction) return;
    setPendingAction("EVOLVE");
    try {
      play("EVOLUTION_BUTTON");
      await Promise.resolve(onEvolve());
      setStatusMessage("Evolución completada.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <MobileInspectorDialogShell
      isOpen={isOpen}
      origin={origin}
      onClose={handleClose}
      closeAriaLabel="Cerrar inspección de carta"
      overlayTopClassName="top-[80px]"
      panelTopClassName="top-[88px] max-h-[calc(100dvh-96px)]"
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
        />
        {statusMessage ? (
          <p className="mt-2 rounded border border-emerald-400/40 bg-emerald-950/30 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </MobileInspectorDialogShell>
  );
}
