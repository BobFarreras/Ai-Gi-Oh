// src/app/admin-portal/[portalSlug]/analytics/page.tsx - Renderiza panel read-only de analytics admin con dashboard de telemetría.
import { AdminAnalyticsPanel } from "@/components/admin/AdminAnalyticsPanel";
import { getAdminAnalyticsDashboard } from "@/services/admin/get-admin-analytics-dashboard";

interface IAdminAnalyticsPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminAnalyticsPage({ params }: IAdminAnalyticsPageProps) {
  await params;
  const dashboard = await getAdminAnalyticsDashboard();
  return <AdminAnalyticsPanel dashboard={dashboard} />;
}
