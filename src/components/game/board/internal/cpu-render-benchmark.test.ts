// src/components/game/board/internal/cpu-render-benchmark.test.ts - Verifica detección de CPU lenta con reloj inyectado y caché de módulo.
import { afterEach, describe, expect, it } from "vitest";
import { measureIsSlowCpu, resetCpuBenchmarkCacheForTests } from "./cpu-render-benchmark";

/** Crea un reloj falso que devuelve valores en secuencia por cada llamada. */
function createFakeClock(values: number[]): () => number {
  let callIndex = 0;
  return () => {
    const value = values[Math.min(callIndex, values.length - 1)];
    callIndex += 1;
    return value;
  };
}

describe("measureIsSlowCpu", () => {
  afterEach(() => {
    resetCpuBenchmarkCacheForTests();
  });

  it("marca CPU lenta cuando la carga supera el umbral", () => {
    expect(measureIsSlowCpu(createFakeClock([0, 12]))).toBe(true);
  });

  it("marca CPU rápida cuando la carga queda bajo el umbral", () => {
    expect(measureIsSlowCpu(createFakeClock([0, 1]))).toBe(false);
  });

  it("cachea el primer resultado y no vuelve a medir", () => {
    expect(measureIsSlowCpu(createFakeClock([0, 12]))).toBe(true);
    // Segunda llamada con reloj "rápido": debe devolver el resultado cacheado.
    expect(measureIsSlowCpu(createFakeClock([0, 1]))).toBe(true);
  });
});
