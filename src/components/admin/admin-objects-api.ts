// src/components/admin/admin-objects-api.ts - Cliente HTTP del CRUD admin de objetos del mercado.
import {
  IAdminShopObjectsSnapshot,
  IAdminUpsertCardUpgradeItemCommand,
  IAdminUpsertLevelCandyCommand,
} from "@/core/entities/admin/IAdminShopObjects";

async function parseApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = (await response.json()) as { message?: string; traceId?: string };
    const suffix = body.traceId ? ` (traceId: ${body.traceId})` : "";
    return new Error(`${body.message ?? fallback}${suffix}`);
  } catch {
    return new Error(fallback);
  }
}

async function postJson(url: string, payload: unknown, fallbackError: string): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseApiError(response, fallbackError);
}

export async function fetchAdminShopObjects(): Promise<IAdminShopObjectsSnapshot> {
  const response = await fetch("/api/admin/objects/snapshot", { method: "GET", cache: "no-store" });
  if (!response.ok) throw await parseApiError(response, "No se pudo cargar el snapshot de objetos.");
  return (await response.json()) as IAdminShopObjectsSnapshot;
}

export function saveAdminLevelCandy(command: IAdminUpsertLevelCandyCommand): Promise<void> {
  return postJson("/api/admin/objects/candy", command, "No se pudo guardar el caramelo.");
}

export function saveAdminCardUpgradeItem(command: IAdminUpsertCardUpgradeItemCommand): Promise<void> {
  return postJson("/api/admin/objects/upgrade", command, "No se pudo guardar el objeto de mejora.");
}
