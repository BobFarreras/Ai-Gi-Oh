// src/services/auth/auth-actions.ts - Server actions para login/logout desacopladas mediante casos de uso de auth.
"use server";

import { createSupabaseAuthRepository } from "@/infrastructure/persistence/supabase/create-supabase-auth-repository";
import { SignInWithEmailUseCase } from "@/core/use-cases/auth/SignInWithEmailUseCase";
import { SignOutUseCase } from "@/core/use-cases/auth/SignOutUseCase";

interface ISignInActionInput {
  email: string;
  password: string;
}

interface IActionResult {
  ok: boolean;
  message: string | null;
}

export async function signInWithEmailAction(input: ISignInActionInput): Promise<IActionResult> {
  try {
    const repository = await createSupabaseAuthRepository();
    const useCase = new SignInWithEmailUseCase(repository);
    await useCase.execute(input);
    return { ok: true, message: null };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo iniciar sesión." };
  }
}

export async function signOutAction(): Promise<void> {
  const repository = await createSupabaseAuthRepository();
  const useCase = new SignOutUseCase(repository);
  await useCase.execute();
}
