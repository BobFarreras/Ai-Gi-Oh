// src/components/admin/internal/admin-analytics-panel.types.ts - Contratos de props para subcomponentes del dashboard de analytics.
import { IDailyActiveUsersPoint, IDeviceDistribution, IEventFrequency } from "@/core/entities/analytics/IAnalyticsDashboard";

export interface IDauChartProps {
  data: IDailyActiveUsersPoint[];
}

export interface ITopEventsChartProps {
  data: IEventFrequency[];
}

export interface IDevicePieProps {
  data: IDeviceDistribution[];
}
