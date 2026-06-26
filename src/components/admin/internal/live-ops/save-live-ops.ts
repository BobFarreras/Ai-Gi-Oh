// src/components/admin/internal/live-ops/save-live-ops.ts - Helper cliente para persistir cualquier definición de live-ops vía el endpoint admin único.
export async function saveLiveOps(type: string, data: unknown): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/progression/upsert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Elimina una definición de live-ops. Acepta un id simple (p. ej. una misión) o
 * una clave compuesta como objeto (p. ej. una regla de evento: { eventId, actionType }).
 */
export async function deleteLiveOps(type: string, payload: string | Record<string, unknown>): Promise<boolean> {
  const body = typeof payload === "string" ? { type, id: payload } : { type, ...payload };
  try {
    const response = await fetch("/api/admin/progression/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}
