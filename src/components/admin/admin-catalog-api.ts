// src/components/admin/admin-catalog-api.ts - Cliente HTTP para consumir endpoints admin de catálogo y mercado desde la UI.
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";

async function parseApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = (await response.json()) as { message?: string; code?: string; traceId?: string };
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

async function deleteJson(url: string, fallbackError: string): Promise<void> {
  const response = await fetch(url, { method: "DELETE", cache: "no-store" });
  if (!response.ok) throw await parseApiError(response, fallbackError);
}

export async function fetchAdminCatalogSnapshot(): Promise<IAdminCatalogSnapshot> {
  const response = await fetch("/api/admin/catalog/snapshot", { method: "GET", cache: "no-store" });
  if (!response.ok) throw await parseApiError(response, "No se pudo cargar snapshot de catálogo admin.");
  return (await response.json()) as IAdminCatalogSnapshot;
}

export function saveAdminCard(command: unknown): Promise<void> {
  return postJson("/api/admin/catalog/cards", command, "No se pudo guardar carta admin.");
}

export function saveAdminListing(command: unknown): Promise<void> {
  return postJson("/api/admin/catalog/listings", command, "No se pudo guardar listing admin.");
}

export function saveAdminPack(command: unknown): Promise<void> {
  return postJson("/api/admin/catalog/packs", command, "No se pudo guardar pack admin.");
}

export function deleteAdminPack(packId: string): Promise<void> {
  return deleteJson(`/api/admin/catalog/packs/${encodeURIComponent(packId)}`, "No se pudo eliminar pack admin.");
}
