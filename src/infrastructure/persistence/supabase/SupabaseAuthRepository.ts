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

  async getCurrentSession(): Promise<IAuthSession | null> {
    const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
      this.client.auth.getSession(),
      this.client.auth.getUser(),
    ]);
    if (sessionError || userError) {
      throw new ValidationError("No se pudo obtener la sesión actual.");
    }
    if (!sessionData.session || !userData.user) return null;
    return mapSession(sessionData.session, userData.user);
  }
}
