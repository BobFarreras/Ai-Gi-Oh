// src/core/hooks/multiplayer/internal/rival-abandon-tracker.ts - Tracker puro del estado de conexión del rival: desconexión, ticking y abandono por timeout.
/**
 * Encapsula la lógica de "el rival se desconectó → empezar a contar → si pasa
 * el timeout, marcar abandono". Extraída del hook useMultiplayerMatchChannel
 * para cumplir SRP y el límite de 150 líneas por hook.
 */
export interface IRivalAbandonTracker {
  /** Marca al rival como conectado y detiene cualquier timer activo. */
  markConnected(): void;
  /** Marca al rival como desconectado e inicia el ticking. */
  markDisconnected(onTick: (elapsedMs: number) => void, onAbandon: () => void): void;
  /** Detiene el timer y libera recursos (llamar en cleanup del effect). */
  dispose(): void;
}

/**
 * Crea un tracker que marca abandono tras `timeoutMs` milisegundos de
 * desconexión. El tick se ejecuta cada 1s para informar el elapsed.
 */
export function createRivalAbandonTracker(timeoutMs: number): IRivalAbandonTracker {
  let disconnectedAt: number | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  function clearTimer(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    markConnected() {
      disconnectedAt = null;
      clearTimer();
    },
    markDisconnected(onTick, onAbandon) {
      disconnectedAt = Date.now();
      clearTimer();
      timer = setInterval(() => {
        const elapsed = Date.now() - (disconnectedAt ?? Date.now());
        onTick(elapsed);
        if (elapsed >= timeoutMs) {
          onAbandon();
          clearTimer();
        }
      }, 1000);
    },
    dispose() {
      clearTimer();
      disconnectedAt = null;
    },
  };
}
