// src/core/use-cases/admin/EnsureAdminAccessUseCase.ts - Garantiza autorización admin y centraliza el fallo tipado de acceso.
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { IAdminAccessRepository, IAdminProfile } from "@/core/repositories/IAdminAccessRepository";

export class EnsureAdminAccessUseCase {
  constructor(private readonly adminAccessRepository: IAdminAccessRepository) {}

  /**
   * Devuelve el perfil admin del usuario o lanza error 403 si no está autorizado.
   */
  async execute(userId: string): Promise<IAdminProfile> {
    const profile = await this.adminAccessRepository.getAdminProfile(userId);
    if (!profile) {
      throw new AuthorizationError("No tienes permisos para acceder al panel administrativo.");
    }
    return profile;
  }
}
