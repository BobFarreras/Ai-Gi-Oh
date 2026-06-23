// src/core/use-cases/analytics/RecordAnalyticsBatchUseCase.ts - Orquesta persistencia de un batch de eventos de telemetría con validación previa.
import { IAnalyticsBatchInput, IAnalyticsEventRow } from "@/core/entities/analytics/IAnalyticsEvent";
import { IAnalyticsWriteRepository } from "@/core/repositories/analytics/IAnalyticsWriteRepository";
import { validateAnalyticsBatch } from "@/core/services/analytics/validate-analytics-event";

export class RecordAnalyticsBatchUseCase {
  constructor(private readonly repository: IAnalyticsWriteRepository) {}

  /** Valida el batch y lo persiste. El userId se deriva server-side, nunca del cliente. */
  async execute(input: IAnalyticsBatchInput, userId: string | null): Promise<number> {
    validateAnalyticsBatch(input.events);
    const rows: IAnalyticsEventRow[] = input.events.map((event) => ({
      userId,
      sessionId: event.sessionId,
      eventName: event.eventName,
      eventCategory: event.eventCategory,
      properties: event.properties,
      pageUrl: event.pageUrl,
      deviceInfo: input.deviceInfo,
    }));
    await this.repository.insertBatch(rows);
    return rows.length;
  }
}
