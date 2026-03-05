// src/infrastructure/database/IDatabaseClient.ts - Abstracción de cliente de base de datos para desacoplar adaptadores de Supabase.
export interface IDatabaseClient {
  query<TRecord>(statement: string, params?: readonly unknown[]): Promise<TRecord[]>;
  execute(statement: string, params?: readonly unknown[]): Promise<void>;
}
