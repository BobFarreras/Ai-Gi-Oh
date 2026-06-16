// src/components/hub/internal/use-hub-hydration-gate.test.ts - Verifica que el gate de hidratación reporta el estado correcto en cliente.
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHubHydrationGate } from "./use-hub-hydration-gate";

describe("useHubHydrationGate", () => {
  it("reporta hidratado tras montar en cliente", () => {
    const { result } = renderHook(() => useHubHydrationGate());
    // renderHook envuelve el montaje en act(), por lo que el efecto ya se aplicó.
    expect(result.current.isHydrated).toBe(true);
  });
});
