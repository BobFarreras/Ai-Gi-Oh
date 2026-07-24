// src/services/story/overworld/overworld-persistence-client.ts - Cliente de persistencia del overworld: marca eventos vistos en el servidor (BD) en vez de solo en el navegador.

/** Ruta del endpoint que persiste un evento del overworld como interactuado. */
const MARK_INTERACTED_ENDPOINT = "/api/story/overworld/mark-interacted";

/** Prefijo del caché de eventos vistos que el overworld guardaba en el navegador (ya retirado). */
const LEGACY_SEEN_EVENTS_KEY_PREFIX = "overworld-seen-events-";

/**
 * Borra el caché de eventos vistos que quedó en los navegadores. Los eventos viven en BD desde que existe
 * `mark-interacted`, pero la escena seguía UNIENDO ese caché al estado del servidor, así que un reset de
 * progreso hecho desde la base de datos no le llegaba al jugador: su navegador volvía a marcar como vistas
 * la intro y las emboscadas del acto. Se limpia una vez al entrar al mundo y no se vuelve a escribir.
 *
 * @returns Cuántas claves se borraron (0 si no había o no hay `localStorage`).
 */
export function purgeLegacyOverworldSeenEventsCache(): number {
  try {
    const staleKeys = Object.keys(window.localStorage).filter((key) => key.startsWith(LEGACY_SEEN_EVENTS_KEY_PREFIX));
    staleKeys.forEach((key) => window.localStorage.removeItem(key));
    return staleKeys.length;
  } catch {
    // Sin localStorage (SSR, modo privado): no hay nada que limpiar.
    return 0;
  }
}

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
