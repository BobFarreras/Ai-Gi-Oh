// src/services/auth/get-current-user-session.ts - Servicio server-side para recuperar sesión actual sin exponer infraestructura en app.
import { GetCurrentSessionUseCase } from "@/core/use-cases/auth/GetCurrentSessionUseCase";
import { IAuthSession } from "@/core/repositories/IAuthRepository";
import { createSupabaseAuthRepository } from "@/infrastructure/persistence/supabase/create-supabase-auth-repository";

export async function getCurrentUserSession(): Promise<IAuthSession | null> {
  const repository = await createSupabaseAuthRepository();
  const useCase = new GetCurrentSessionUseCase(repository);
  return useCase.execute();
}
