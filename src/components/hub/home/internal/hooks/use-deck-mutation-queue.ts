// src/components/hub/home/internal/hooks/use-deck-mutation-queue.ts - Serializa mutaciones de deck en cola FIFO para evitar desincronizaciones por concurrencia.
import { useCallback, useRef, useState } from "react";

interface IEnqueueDeckMutationInput<TResult> {
  applyOptimistic: () => void;
  run: () => Promise<TResult>;
  onSuccess: (result: TResult) => Promise<void> | void;
  onError: (error: unknown) => Promise<void> | void;
}

interface IDeckMutationQueue {
  enqueueDeckMutation: <TResult>(input: IEnqueueDeckMutationInput<TResult>) => Promise<TResult | null>;
  hasPendingMutations: boolean;
}

/**
 * Garantiza ejecución serial de mutaciones del deck manteniendo UI optimista inmediata.
 */
export function useDeckMutationQueue(): IDeckMutationQueue {
  const queueTailRef = useRef<Promise<void>>(Promise.resolve());
  const [pendingCount, setPendingCount] = useState(0);

  const enqueueDeckMutation = useCallback(
    async <TResult>(input: IEnqueueDeckMutationInput<TResult>): Promise<TResult | null> => {
      input.applyOptimistic();
      setPendingCount((value) => value + 1);
      const runMutation = async (): Promise<TResult | null> => {
        try {
          const result = await input.run();
          await input.onSuccess(result);
          return result;
        } catch (error: unknown) {
          await input.onError(error);
          return null;
        } finally {
          setPendingCount((value) => Math.max(0, value - 1));
        }
      };
      const job = queueTailRef.current.then(runMutation, runMutation);
      queueTailRef.current = job.then(() => undefined, () => undefined);
      return job;
    },
    [],
  );

  return { enqueueDeckMutation, hasPendingMutations: pendingCount > 0 };
}
