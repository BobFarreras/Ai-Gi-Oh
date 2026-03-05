// src/infrastructure/persistence/supabase/SupabaseAuthRepository.ts - Implementa autenticación real usando Supabase sin exponer SDK al dominio.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAuthCredentials, IAuthRepository, IAuthSession } from "@/core/repositories/IAuthRepository";

function mapSession(session: NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>["data"]["session"]>): IAuthSession {
  return {
    accessToken: session.access_token,
    expiresAtIso: new Date(session.expires_at ? session.expires_at * 1000 : Date.now()).toISOString(),
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      displayName: typeof session.user.user_metadata?.display_name === "string" ? session.user.user_metadata.display_name : null,
    },
  };
}

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async signInWithEmail(credentials: IAuthCredentials): Promise<IAuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error || !data.session) {
      throw new ValidationError("No se pudo iniciar sesión con las credenciales proporcionadas.");
    }
    return mapSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw new ValidationError("No se pudo cerrar sesión correctamente.");
    }
  }

  async signUpWithEmail(credentials: IAuthCredentials): Promise<IAuthSession> {
    const { data, error } = await this.client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
    });
    if (error || !data.session) {
      throw new ValidationError("No se pudo registrar la cuenta con los datos proporcionados.");
    }
    return mapSession(data.session);
  }

  async getCurrentSession(): Promise<IAuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) {
      throw new ValidationError("No se pudo obtener la sesión actual.");
    }
    return data.session ? mapSession(data.session) : null;
  }
}
