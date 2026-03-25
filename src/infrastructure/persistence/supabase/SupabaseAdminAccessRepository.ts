// src/infrastructure/persistence/supabase/SupabaseAdminAccessRepository.ts - Lee membresía administrativa activa desde Supabase para enforcing server-side.
import { SupabaseClient } from "@supabase/supabase-js";
import { IAdminAccessRepository, IAdminProfile } from "@/core/repositories/IAdminAccessRepository";
import { ValidationError } from "@/core/errors/ValidationError";

interface IAdminAccessRow {
  user_id: string;
  role: "ADMIN" | "SUPER_ADMIN";
  is_active: boolean;
}

export class SupabaseAdminAccessRepository implements IAdminAccessRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getAdminProfile(userId: string): Promise<IAdminProfile | null> {
    const { data, error } = await this.client
      .from("admin_users")
      .select("user_id,role,is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle<IAdminAccessRow>();
    if (error) throw new ValidationError("No se pudo validar el acceso administrativo.");
    if (!data?.is_active) return null;
    return { userId: data.user_id, role: data.role };
  }
}
