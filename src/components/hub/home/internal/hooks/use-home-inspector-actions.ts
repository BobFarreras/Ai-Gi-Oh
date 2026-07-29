// src/components/hub/home/internal/hooks/use-home-inspector-actions.ts - Orquesta mutaciones del inspector móvil sin cerrarlo.
import { useState } from "react";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";
import { useHomeInspectorStatus } from "./use-home-inspector-status";

interface IHomeInspectorActionsInput {
  onInsert: () => Promise<IHomeActionResult>;
  onRemove: () => Promise<IHomeActionResult>;
  onEvolve: () => Promise<IHomeActionResult>;
  onClose: () => void;
}

/** Mantiene el detalle durante cambios de deck y solo lo cierra para la cinemática de evolución. */
export function useHomeInspectorActions(input: IHomeInspectorActionsInput) {
  const [pendingAction, setPendingAction] = useState<"INSERT" | "REMOVE" | "EVOLVE" | null>(null);
  const { statusMessage, setStatusMessage } = useHomeInspectorStatus();

  const runDeckMutation = async (
    action: "INSERT" | "REMOVE",
    execute: () => Promise<IHomeActionResult>,
  ) => {
    if (pendingAction) return;
    setPendingAction(action);
    try {
      const result = await execute();
      if (!result.ok) {
        const fallback = action === "INSERT" ? "No se pudo añadir la carta." : "No se pudo retirar la carta.";
        setStatusMessage({ tone: "error", text: result.message ?? fallback });
        return;
      }
      setStatusMessage({
        tone: "success",
        text: action === "INSERT" ? "Carta añadida al deck." : "Carta retirada del deck.",
      });
    } catch (error) {
      const fallback = action === "INSERT" ? "No se pudo añadir la carta." : "No se pudo retirar la carta.";
      setStatusMessage({ tone: "error", text: error instanceof Error ? error.message : fallback });
    } finally {
      setPendingAction(null);
    }
  };

  const handleEvolve = async () => {
    if (pendingAction) return;
    setPendingAction("EVOLVE");
    // La cinemática es fullscreen; aquí sí se cierra el inspector para no taparla.
    input.onClose();
    try {
      await input.onEvolve();
    } finally {
      setPendingAction(null);
    }
  };

  return {
    pendingAction,
    statusMessage,
    handleInsert: () => runDeckMutation("INSERT", input.onInsert),
    handleRemove: () => runDeckMutation("REMOVE", input.onRemove),
    handleEvolve,
  };
}
