// src/core/repositories/IAdminAccessRepository.ts - Contrato para validar si un usuario autenticado dispone de rol administrativo activo.
export interface IAdminProfile {
  userId: string;
  role: "ADMIN" | "SUPER_ADMIN";
}

export interface IAdminAccessRepository {
  getAdminProfile(userId: string): Promise<IAdminProfile | null>;
}
