// src/components/game/board/internal/cpu-render-benchmark.ts - Micro-benchmark de CPU cacheado para detectar equipos lentos sin señales de hardware.

/**
 * Umbral en ms: una CPU de escritorio moderna completa la carga en <2ms;
 * equipos antiguos o móviles de gama baja suelen superar los 5ms.
 */
const SLOW_CPU_THRESHOLD_MS = 5;
const WARMUP_ITERATIONS = 10_000;
const BENCHMARK_ITERATIONS = 150_000;

/** Resultado cacheado a nivel de módulo: el benchmark solo se ejecuta una vez por sesión. */
let cachedIsSlowCpu: boolean | null = null;

/**
 * Carga de trabajo aritmética fija; devuelve el acumulador para evitar
 * que el motor JS elimine el bucle por dead-code elimination.
 */
function runCpuWorkload(iterations: number): number {
  let accumulator = 0;
  for (let index = 1; index <= iterations; index += 1) {
    accumulator += Math.sqrt(index) % 3;
  }
  return accumulator;
}

/**
 * Mide una única vez si la CPU es lenta para renderizado intensivo.
 * Acepta un reloj inyectable para tests deterministas.
 */
export function measureIsSlowCpu(now: () => number = () => performance.now()): boolean {
  if (cachedIsSlowCpu !== null) {
    return cachedIsSlowCpu;
  }
  runCpuWorkload(WARMUP_ITERATIONS);
  const start = now();
  runCpuWorkload(BENCHMARK_ITERATIONS);
  cachedIsSlowCpu = now() - start > SLOW_CPU_THRESHOLD_MS;
  return cachedIsSlowCpu;
}

/** Limpia el caché del benchmark; solo para uso en tests. */
export function resetCpuBenchmarkCacheForTests(): void {
  cachedIsSlowCpu = null;
}
