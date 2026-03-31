// src/services/player-persistence/internal/player-runtime-init-gate.ts - Evita inicializaciones concurrentes del mismo jugador en runtime server.
const pendingInitsByPlayerId = new Map<string, Promise<void>>();

/**
 * Garantiza que la inicialización de runtime de un jugador no corra en paralelo.
 */
export async function runPlayerRuntimeInitOnce(playerId: string, run: () => Promise<void>): Promise<void> {
  const pending = pendingInitsByPlayerId.get(playerId);
  if (pending) {
    await pending;
    return;
  }
  const nextPromise = (async () => {
    try {
      await run();
    } finally {
      pendingInitsByPlayerId.delete(playerId);
    }
  })();
  pendingInitsByPlayerId.set(playerId, nextPromise);
  await nextPromise;
}
