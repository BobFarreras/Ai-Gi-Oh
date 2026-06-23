// src/core/repositories/progression/IEventRepository.ts - Contrato de lectura del evento activo y canje en su tienda. Identidad derivada por el backend.
import { IEventOverview, IEventRedeemResult } from "@/core/entities/progression/IEvent";

export interface IEventRepository {
  /** Evento activo con puntos del jugador e items de tienda, o null si no hay evento activo. */
  getOverview(): Promise<IEventOverview | null>;
  /** Canjea un item de la tienda de evento (valida puntos y límite, otorga la carta). */
  redeem(itemId: string): Promise<IEventRedeemResult>;
}
