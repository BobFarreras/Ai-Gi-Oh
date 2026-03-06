// src/core/repositories/IAuthRepository.ts - Contrato de autenticación de aplicación desacoplado de proveedores externos.
import { IAuthenticatedUser } from "@/core/entities/auth/IAuthenticatedUser";

export interface IAuthCredentials {
  email: string;
  password: string;
}

export interface IAuthSession {
  accessToken: string;
  expiresAtIso: string;
  user: IAuthenticatedUser;
}

export interface IAuthRepository {
  signInWithEmail(credentials: IAuthCredentials): Promise<IAuthSession>;
  signUpWithEmail(credentials: IAuthCredentials): Promise<IAuthSession>;
  signOut(): Promise<void>;
  getCurrentSession(): Promise<IAuthSession | null>;
}
