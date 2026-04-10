// src/core/use-cases/auth/SignUpWithEmailUseCase.ts - Ejecuta registro por email/password con validaciones de seguridad básicas.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAuthRepository, IAuthSession } from "@/core/repositories/IAuthRepository";
import { hasSecurePassword } from "@/core/use-cases/auth/internal/password-policy";

interface ISignUpWithEmailInput {
  email: string;
  password: string;
}

export class SignUpWithEmailUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: ISignUpWithEmailInput): Promise<IAuthSession> {
    if (!input.email.trim()) {
      throw new ValidationError("El email es obligatorio.");
    }
    if (!input.password.trim()) {
      throw new ValidationError("La contraseña es obligatoria.");
    }
    if (!hasSecurePassword(input.password)) {
      throw new ValidationError("La contraseña debe tener al menos 8 caracteres.");
    }
    return this.authRepository.signUpWithEmail({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
  }
}
