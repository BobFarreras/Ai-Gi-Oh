// src/components/admin/admin-starter-deck-api.ts - Cliente HTTP para cargar y guardar plantillas starter deck en panel admin.
import { ICard } from "@/core/entities/ICard";
import { IAdminStarterDeckTemplateData } from "@/core/entities/admin/IAdminStarterDeckTemplate";

export interface IAdminStarterDeckApiResponse extends IAdminStarterDeckTemplateData {
  availableCards: ICard[];
}

interface ISaveStarterDeckPayload {
  templateKey: string;
  cardIds: string[];
  activate: boolean;
}

async function parseApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = (await response.json()) as { message?: string; traceId?: string };
    const trace = body.traceId ? ` (traceId: ${body.traceId})` : "";
    return new Error(`${body.message ?? fallback}${trace}`);
  } catch {
    return new Error(fallback);
  }
}

export async function fetchAdminStarterDeckTemplateData(templateKey?: string): Promise<IAdminStarterDeckApiResponse> {
  const query = templateKey ? `?templateKey=${encodeURIComponent(templateKey)}` : "";
  const response = await fetch(`/api/admin/starter-deck/template${query}`, { method: "GET", cache: "no-store" });
  if (!response.ok) throw await parseApiError(response, "No se pudo cargar starter deck admin.");
  return (await response.json()) as IAdminStarterDeckApiResponse;
}

export async function saveAdminStarterDeckTemplate(payload: ISaveStarterDeckPayload): Promise<void> {
  const response = await fetch("/api/admin/starter-deck/template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseApiError(response, "No se pudo guardar starter deck admin.");
}
