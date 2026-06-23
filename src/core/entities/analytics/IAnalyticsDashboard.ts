// src/core/entities/analytics/IAnalyticsDashboard.ts - Contratos de datos del dashboard de analytics para panel admin read-only.

/** Un punto en la serie temporal de DAU (usuarios activos por día). */
export interface IDailyActiveUsersPoint {
  date: string;
  count: number;
}

/** Un evento con su frecuencia de aparición. */
export interface IEventFrequency {
  eventName: string;
  count: number;
}

/** Distribución de sesiones por tipo de dispositivo. */
export interface IDeviceDistribution {
  deviceType: string;
  count: number;
}

/** Un jugador en el ranking de actividad. */
export interface ITopPlayer {
  userId: string;
  nickname: string;
  duels: number;
}

/** Una carta con su frecuencia de uso o compra. */
export interface ICardFrequency {
  cardId: string;
  cardName: string;
  count: number;
}

/** Una entrada de la lista de usuarios conectados recientemente. */
export interface IRecentUser {
  userId: string;
  nickname: string;
  email?: string | null;
  lastSession: string;
  sessions: number;
  deviceType: string | null;
}

/** Snapshot completo del dashboard de analytics. */
export interface IAnalyticsDashboard {
  dau: IDailyActiveUsersPoint[];
  totalEvents30d: number;
  totalSessions30d: number;
  avgSessionDurationSeconds: number | null;
  topEvents: IEventFrequency[];
  deviceDistribution: IDeviceDistribution[];
  topPlayers: ITopPlayer[];
  topCardsUsed: ICardFrequency[];
  topCardsPurchased: ICardFrequency[];
  recentUsers: IRecentUser[];
}
