// src/core/use-cases/admin/GetAdminAuditLogPageUseCase.ts - Valida query de auditoría y delega consulta paginada al repositorio.
import { IAdminAuditLogPage, IAdminAuditLogPageQuery } from "@/core/entities/admin/IAdminAuditLog";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminAuditLogReadRepository } from "@/core/repositories/admin/IAdminAuditLogReadRepository";

function normalizePositiveInteger(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value));
}

function normalizePageSize(value: number): number {
  return Math.min(100, normalizePositiveInteger(value, 20));
}

export class GetAdminAuditLogPageUseCase {
  constructor(private readonly repository: IAdminAuditLogReadRepository) {}

  /**
   * Obtiene una página de auditoría con límites máximos para evitar abuso de lectura.
   */
  async execute(query: IAdminAuditLogPageQuery): Promise<IAdminAuditLogPage> {
    const page = normalizePositiveInteger(query.page, 1);
    const pageSize = normalizePageSize(query.pageSize);
    if (query.fromIso && Number.isNaN(Date.parse(query.fromIso))) throw new ValidationError("Filtro from inválido.");
    if (query.toIso && Number.isNaN(Date.parse(query.toIso))) throw new ValidationError("Filtro to inválido.");
    return this.repository.listPage({ ...query, page, pageSize });
  }
}

