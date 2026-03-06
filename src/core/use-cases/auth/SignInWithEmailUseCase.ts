// src/core/use-cases/auth/SignInWithEmailUseCase.ts - Ejecuta inicio de sesión por email/password con validación de entrada.
import { ValidationError } from "@/core/errors/ValidationError";
import { IAuthRepository, IAuthSession } from "@/core/repositories/IAuthRepository";

interface ISignInWithEmailInput {
  email: string;
  password: string;
}

export class SignInWithEmailUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: ISignInWithEmailInput): Promise<IAuthSession> {
    if (!input.email.trim()) {
      throw new ValidationError("El email es obligatorio.");
    }
    if (!input.password.trim()) {
      throw new ValidationError("La contraseña es obligatoria.");
    }
    return this.authRepository.signInWithEmail({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
  }
}
