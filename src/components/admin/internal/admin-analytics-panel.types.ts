// src/components/admin/internal/admin-analytics-panel.types.ts - Contratos de props para subcomponentes del dashboard de analytics.
import { ICardFrequency, IDailyActiveUsersPoint, IDeviceDistribution, IEventFrequency, IRecentUser, ITopPlayer } from "@/core/entities/analytics/IAnalyticsDashboard";

export interface IDauChartProps {
  data: IDailyActiveUsersPoint[];
}

export interface ITopEventsChartProps {
  data: IEventFrequency[];
}

export interface IDevicePieProps {
  data: IDeviceDistribution[];
}

export interface ITopPlayersProps {
  data: ITopPlayer[];
}

export interface ICardRankingProps {
  title: string;
  data: ICardFrequency[];
}

export interface IRecentUsersProps {
  data: IRecentUser[];
}
