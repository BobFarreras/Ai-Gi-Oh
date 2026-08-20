// src/components/hub/academy/training/modes/olympus/olympus-api-client.ts - Cliente HTTP tipado del flujo autoritativo de Olimpo.
import { ICombatJournalEntry, ICombatProof, ICombatSession } from "@/core/entities/match";
import {
  IOlympusBattle,
  IOlympusChampion,
  IOlympusChampionProgress,
  IOlympusLegend,
  IOlympusReward,
  OlympusOutcome,
} from "@/core/entities/olympus/IOlympus";
import { IOlympusOverview as IOlympusOverviewBase } from "@/core/use-cases/olympus/GetOlympusOverviewUseCase";
import { IOlympusRespecQuote } from "@/core/services/olympus/resolve-respec-quote";
import { IOlympusChampionCard } from "@/services/olympus/resolve-olympus-champion-cards";
import { IOlympusChampionDeckPreview } from "@/services/olympus/resolve-champion-deck-preview";
import { IOlympusLegendCard } from "@/services/olympus/resolve-olympus-legend-cards";
import { GameState } from "@/core/use-cases/GameEngine";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

/** La ruta decora campeones y leyendas con lo que vive fuera del dominio antes de devolverlos. */
export interface IOlympusOverview extends Omit<IOlympusOverviewBase, "champions" | "legends"> {
  champions: IOlympusChampionCard[];
  legends: IOlympusLegendCard[];
}

export type { IOlympusChampionCard, IOlympusChampionDeckPreview, IOlympusLegendCard };

export interface IOlympusPresentation {
  championName: string;
  championAvatarUrl: string | null;
  legendName: string;
  legendAvatarUrl: string | null;
  legendIntroUrl: string | null;
  specialRules: string[];
}

export interface IOlympusBattleRuntime {
  battle: IOlympusBattle;
  champion: IOlympusChampion;
  legend: IOlympusLegend;
  resumed: boolean;
  session: ICombatSession;
  initialState: GameState;
  completionTicket: string;
  presentation: IOlympusPresentation;
  /** Perfil fijado por el catálogo: el cliente debe animar con el mismo que reproduce el servidor. */
  aiProfile: IOlympusLegend["aiProfile"];
  /** Acciones ya registradas por el servidor cuando se retoma un combate a medias. */
  journalEntries: ICombatJournalEntry[];
}

export interface IOlympusSettlement {
  battle: IOlympusBattle;
  outcome: OlympusOutcome;
  reward: IOlympusReward;
  ascensionFragments: number;
  duplicate: boolean;
}

/** El servidor decide si el diario reportado cierra el combate o solo registra avance. */
export type IOlympusSubmission =
  | ({ settled: true } & IOlympusSettlement)
  | { settled: false; journalLength: number };

export interface IOlympusUpgradeResult {
  ascensionFragments: number;
  progress: IOlympusChampionProgress | null;
  quote?: IOlympusRespecQuote;
}

/** Convierte errores HTTP en mensajes aptos para UI; la API responde `{ code, message, traceId }`. */
async function request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    if (response.status === 429) {
      throw new Error("Demasiadas peticiones seguidas. Espera unos segundos y vuelve a intentarlo.");
    }
    throw new Error(payload?.message ?? payload?.error ?? "No se pudo completar la operación de Olimpo.");
  }
  return response.json() as Promise<T>;
}

export function fetchOlympusOverview(): Promise<IOlympusOverview> {
  return request("/api/olympus/overview");
}

/** Emite o reanuda la batalla y restaura la fábrica de ids perdida al serializar JSON. */
export async function issueOlympusBattle(championId: string, opponentId: string): Promise<IOlympusBattleRuntime> {
  const runtime = await request<IOlympusBattleRuntime>("/api/olympus/battles/issue", { championId, opponentId });
  runtime.initialState.idFactory = createSeededGameEngineIdFactory(runtime.session.seed);
  return runtime;
}

/** Envía el diario y el ticket; el servidor guarda avance o liquida según haya desenlace. */
export function completeOlympusBattle(completionTicket: string, proof: ICombatProof): Promise<IOlympusSubmission> {
  return request("/api/olympus/battles/complete", { completionTicket, proof });
}

/** Cierra la batalla bloqueada como derrota sin consumir un intento adicional. */
export function resetOlympusBattle(): Promise<{ forfeited: true }> {
  return request("/api/olympus/battles/reset", {});
}

export function purchaseChampionUpgrade(championId: string, nodeId: string): Promise<IOlympusUpgradeResult> {
  return request("/api/olympus/upgrades/purchase", { championId, nodeId });
}

export function respecChampionUpgrades(championId: string): Promise<IOlympusUpgradeResult> {
  return request("/api/olympus/upgrades/respec", { championId });
}

// El mazo solo cambia al comprar un rango, y esa compra ya invalida la caché: mientras tanto, reabrir
// el diálogo no debe volver a pagar la latencia de resolver el catálogo entero.
const championDeckCache = new Map<string, Promise<IOlympusChampionDeckPreview>>();

/** El mazo llega resuelto por el mismo camino que el snapshot de combate, no reconstruido en cliente. */
export function fetchChampionDeck(championId: string): Promise<IOlympusChampionDeckPreview> {
  const cached = championDeckCache.get(championId);
  if (cached) return cached;
  const pending = request<IOlympusChampionDeckPreview>(
    `/api/olympus/champions/deck?championId=${encodeURIComponent(championId)}`,
  ).catch((error: unknown) => {
    // Un fallo no se cachea: el siguiente intento tiene que volver a pedirlo.
    championDeckCache.delete(championId);
    throw error;
  });
  championDeckCache.set(championId, pending);
  return pending;
}

/** Toda mejora reescala el mazo prestado, así que la vista previa guardada deja de ser cierta. */
export function invalidateChampionDeckCache(championId?: string): void {
  if (championId) championDeckCache.delete(championId);
  else championDeckCache.clear();
}
