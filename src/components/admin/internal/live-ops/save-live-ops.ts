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

/** Elimina una definición de live-ops por id (p. ej. una misión). */
export async function deleteLiveOps(type: string, id: string): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/progression/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
