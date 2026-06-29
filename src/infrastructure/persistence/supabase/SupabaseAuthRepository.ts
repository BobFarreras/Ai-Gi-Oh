// src/infrastructure/persistence/supabase/SupabaseAuthRepository.ts - Implementa autenticación real usando Supabase sin exponer SDK al dominio.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAuthCredentials, IAuthRepository, IAuthSession } from "@/core/repositories/IAuthRepository";

type TSupabaseSession = NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>["data"]["session"]>;
type TSupabaseUser = NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>["data"]["user"]>;

function mapSession(session: TSupabaseSession, userOverride?: TSupabaseUser): IAuthSession {
  // Priorizamos `getUser()` cuando está disponible para evitar confiar en `session.user` desde storage.
  const user = userOverride ?? session.user;
  return {
    accessToken: session.access_token,
    expiresAtIso: new Date(session.expires_at ? session.expires_at * 1000 : Date.now()).toISOString(),
    user: {
      id: user.id,
      email: user.email ?? null,
      displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null,
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

  async requestPasswordRecovery(email: string, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      throw new ValidationError("No se pudo iniciar la recuperación de contraseña.");
    }
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) {
      throw new ValidationError("No se pudo actualizar la contraseña.");
    }
  }

  async getCurrentSession(): Promise<IAuthSession | null> {
    // Sin sesión (p. ej. en /login) getUser() devuelve AuthSessionMissingError: eso NO es un
    // fallo, es simplemente "no autenticado". Comprobamos primero la sesión y devolvemos null.
    const { data: sessionData, error: sessionError } = await this.client.auth.getSession();
    if (sessionError) {
      throw new ValidationError("No se pudo obtener la sesión actual.");
    }
    if (!sessionData.session) return null;
    // Hay cookies de sesión: validamos el usuario contra el servidor de auth.
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError || !userData.user) return null;
    return mapSession(sessionData.session, userData.user);
  }
}
