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

/** Snapshot completo del dashboard de analytics. */
export interface IAnalyticsDashboard {
  dau: IDailyActiveUsersPoint[];
  totalEvents30d: number;
  totalSessions30d: number;
  avgSessionDurationSeconds: number | null;
  topEvents: IEventFrequency[];
  deviceDistribution: IDeviceDistribution[];
}
