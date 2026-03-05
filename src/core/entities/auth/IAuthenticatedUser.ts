// src/core/entities/auth/IAuthenticatedUser.ts - Define usuario autenticado mínimo desacoplado del proveedor de identidad.
export interface IAuthenticatedUser {
  id: string;
  email: string | null;
  displayName: string | null;
}
