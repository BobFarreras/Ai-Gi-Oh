// src/core/use-cases/auth/RequestPasswordRecoveryUseCase.ts - Inicia recuperación de contraseña validando entrada y redirección segura.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";

interface IRequestPasswordRecoveryInput {
  email: string;
  redirectTo: string;
}

export class RequestPasswordRecoveryUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: IRequestPasswordRecoveryInput): Promise<void> {
    if (!input.email.trim()) {
      throw new ValidationError("El email es obligatorio.");
    }
    if (!input.redirectTo.trim()) {
      throw new ValidationError("La URL de recuperación es obligatoria.");
    }
    await this.authRepository.requestPasswordRecovery(input.email.trim().toLowerCase(), input.redirectTo.trim());
  }
}
