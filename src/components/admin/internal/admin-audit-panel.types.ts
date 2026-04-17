// src/components/admin/internal/admin-audit-panel.types.ts - Tipos del panel de auditoría admin.
import { IAdminAuditLogPage, IAdminAuditLogPageQuery } from "@/core/entities/admin/IAdminAuditLog";

export interface IAdminAuditCardVisual {
  cardId: string;
  cardName: string;
  renderUrl: string | null;
}

export interface IAdminAuditPanelProps {
  portalSlug: string;
  page: IAdminAuditLogPage;
  query: IAdminAuditLogPageQuery;
  cardVisualById: Record<string, IAdminAuditCardVisual>;
}
