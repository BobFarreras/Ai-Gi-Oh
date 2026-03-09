// src/components/hub/home/internal/hooks/use-deck-mutation-guard.ts - Controla concurrencia de mutaciones optimistas del deck para evitar sobrescrituras tardías.
import { useRef } from "react";

interface IDeckMutationGuard {
  beginMutation: () => number;
  isLatestMutation: (mutationId: number) => boolean;
}

/**
 * Evita aplicar respuestas asíncronas obsoletas cuando hay múltiples mutaciones encadenadas.
 */
export function useDeckMutationGuard(): IDeckMutationGuard {
  const deckMutationIdRef = useRef(0);
  const beginMutation = (): number => {
    deckMutationIdRef.current += 1;
    return deckMutationIdRef.current;
  };
  const isLatestMutation = (mutationId: number): boolean => mutationId === deckMutationIdRef.current;
  return { beginMutation, isLatestMutation };
}
