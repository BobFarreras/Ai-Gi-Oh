// src/components/hub/academy/tutorial/nodes/internal/use-tutorial-node-completion-sync.ts - Sincroniza completion idempotente de nodos tutorial para evitar lógica duplicada entre clientes.
"use client";
import { useEffect, useRef } from "react";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { postTutorialNodeCompletion } from "@/services/tutorial/tutorial-node-progress-client";

interface IUseTutorialNodeCompletionSyncInput {
  tutorial: ReturnType<typeof useTutorialFlowController>;
  nodeId: string;
}

/**
 * Persiste completion una sola vez por sesión de nodo y revierte lock local si falla la red.
 */
export function useTutorialNodeCompletionSync(input: IUseTutorialNodeCompletionSyncInput): void {
  const hasSyncedCompletionRef = useRef(false);

  useEffect(() => {
    if (!input.tutorial.isFinished || hasSyncedCompletionRef.current) return;
    hasSyncedCompletionRef.current = true;
    postTutorialNodeCompletion(input.nodeId).catch(() => {
      hasSyncedCompletionRef.current = false;
    });
  }, [input.nodeId, input.tutorial.isFinished]);
}
