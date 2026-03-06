<!-- src/infrastructure/persistence/supabase/README.md - Guía de adaptadores Supabase para implementar contratos de persistencia. -->
# Adaptadores Supabase

Esta carpeta contendrá implementaciones concretas de repositorios de `core/repositories`:

1. `SupabaseAuthRepository`
2. `SupabasePlayerProfileRepository`
3. `SupabasePlayerProgressRepository`
4. Factories server-side:
   - `create-supabase-auth-repository.ts`
   - `create-supabase-player-profile-repository.ts`
   - `create-supabase-player-progress-repository.ts`
5. Adaptadores de Home/Market persistentes:
   - `SupabaseWalletRepository`
   - `SupabaseCardCollectionRepository`
   - `SupabaseDeckRepository`
   - `SupabaseTransactionRepository`

## Reglas

1. No exportar objetos de SDK al dominio.
2. Mapear DTO de Supabase a entidades de `core/entities`.
3. Gestionar errores de proveedor y traducirlos a errores de aplicación.
