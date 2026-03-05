// src/core/use-cases/auth/SignOutUseCase.ts - Cierra la sesión autenticada actual.
import { IAuthRepository } from "@/core/repositories/IAuthRepository";

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}
