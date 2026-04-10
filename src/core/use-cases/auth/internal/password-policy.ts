// src/core/use-cases/auth/internal/password-policy.ts - Reglas mínimas de contraseña compartidas por casos de uso de autenticación.
export const AUTH_MIN_PASSWORD_LENGTH = 8;

/**
 * Evalúa si la contraseña cumple la política de seguridad mínima del dominio auth.
 */
export function hasSecurePassword(password: string): boolean {
  return password.length >= AUTH_MIN_PASSWORD_LENGTH;
}
