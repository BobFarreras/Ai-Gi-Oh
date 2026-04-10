// src/core/use-cases/auth/UpdatePasswordUseCase.ts - Actualiza la contraseña autenticada aplicando política mínima de seguridad.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";
import { hasSecurePassword } from "@/core/use-cases/auth/internal/password-policy";

interface IUpdatePasswordInput {
  password: string;
}

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: IUpdatePasswordInput): Promise<void> {
    if (!input.password.trim()) {
      throw new ValidationError("La contraseña es obligatoria.");
    }
    if (!hasSecurePassword(input.password)) {
      throw new ValidationError("La contraseña debe tener al menos 8 caracteres.");
    }
    await this.authRepository.updatePassword(input.password);
  }
}
