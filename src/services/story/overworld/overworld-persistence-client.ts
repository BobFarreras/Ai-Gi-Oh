// src/services/story/overworld/overworld-persistence-client.ts - Cliente de persistencia del overworld: marca eventos vistos en el servidor (BD) en vez de solo en el navegador.

/** Ruta del endpoint que persiste un evento del overworld como interactuado. */
const MARK_INTERACTED_ENDPOINT = "/api/story/overworld/mark-interacted";

/**
 * Persiste en servidor (BD) que el jugador ha visto un nodo de evento del overworld.
 * Es idempotente en backend, por lo que reintentar no duplica estado. Nunca lanza:
 * si la red falla devuelve `false` y el caché local sigue cubriendo la sesión actual.
 *
 * @param nodeId Id del nodo de evento (formato `story-...`).
 * @returns `true` si el servidor confirmó la persistencia, `false` si falló.
 */
export async function markOverworldEventInteracted(nodeId: string): Promise<boolean> {
  try {
    const response = await fetch(MARK_INTERACTED_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nodeId }),
    });
    return response.ok;
  } catch {
    // La persistencia de eventos es best-effort: si falla, no bloquea el juego.
    return false;
  }
}
