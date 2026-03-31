// src/components/hub/home/internal/hooks/use-deck-mutation-queue.test.ts - Verifica cola FIFO de mutaciones optimistas para evitar carreras en Arsenal.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDeckMutationQueue } from "./use-deck-mutation-queue";

interface IDeferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function createDeferred<T>(): IDeferred<T> {
  let resolveFn: ((value: T) => void) | null = null;
  const promise = new Promise<T>((resolve) => {
    resolveFn = resolve;
  });
  return {
    promise,
    resolve: (value: T) => {
      if (resolveFn) resolveFn(value);
    },
  };
}

describe("useDeckMutationQueue", () => {
  it("ejecuta mutaciones en orden FIFO y mantiene optimismo inmediato", async () => {
    const events: string[] = [];
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const { result } = renderHook(() => useDeckMutationQueue());
    let firstResult: Promise<string | null> | null = null;
    let secondResult: Promise<string | null> | null = null;

    await act(async () => {
      firstResult = result.current.enqueueDeckMutation({
        applyOptimistic: () => { events.push("optimistic-1"); },
        run: async () => {
          events.push("run-1");
          return first.promise;
        },
        onSuccess: () => { events.push("success-1"); },
        onError: () => { events.push("error-1"); },
      });
      secondResult = result.current.enqueueDeckMutation({
        applyOptimistic: () => { events.push("optimistic-2"); },
        run: async () => {
          events.push("run-2");
          return second.promise;
        },
        onSuccess: () => { events.push("success-2"); },
        onError: () => { events.push("error-2"); },
      });
    });

    expect(events).toEqual(["optimistic-1", "optimistic-2", "run-1"]);
    expect(result.current.hasPendingMutations).toBe(true);

    await act(async () => {
      first.resolve("first-ok");
      await firstResult;
    });

    expect(events).toEqual(["optimistic-1", "optimistic-2", "run-1", "success-1", "run-2"]);

    await act(async () => {
      second.resolve("second-ok");
      await secondResult;
    });

    expect(events).toEqual(["optimistic-1", "optimistic-2", "run-1", "success-1", "run-2", "success-2"]);
    expect(result.current.hasPendingMutations).toBe(false);
  });
});
