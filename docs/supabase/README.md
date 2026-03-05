<!-- docs/supabase/README.md - Guía operativa para ejecutar scripts SQL de Supabase por fases del proyecto. -->
# Supabase SQL por Fases

## Fase 2 (Perfil y Progreso)

1. Ejecuta `docs/supabase/sql/001_phase_2_player_profile_progress.sql` en el SQL Editor de Supabase.
2. Verifica que existen:
   - `public.player_profiles`
   - `public.player_progress`
3. Verifica que RLS está activa en ambas tablas.
4. Verifica creación automática tras registro:
   - crea un usuario nuevo,
   - confirma que aparecen filas en ambas tablas con `player_id = auth.users.id`.

## Notas

1. El trigger `on_auth_user_created` solo debe existir una vez.
2. Si ya tienes datos, el script es idempotente para políticas/trigger principales.
