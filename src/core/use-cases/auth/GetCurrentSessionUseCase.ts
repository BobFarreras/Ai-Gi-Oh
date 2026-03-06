// src/core/use-cases/auth/GetCurrentSessionUseCase.ts - Obtiene la sesión autenticada actual mediante el repositorio de autenticación.
import { IAuthRepository, IAuthSession } from "@/core/repositories/IAuthRepository";

export class GetCurrentSessionUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<IAuthSession | null> {
    return this.authRepository.getCurrentSession();
  }
}
