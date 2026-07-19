-- docs/supabase/sql/135_lock_player_progress_writes.sql
-- 🔴 ARREGLO DE SEGURIDAD: player_progress se quedó FUERA del cierre de la migración 122.
--
-- La 122 blindó player_wallets, player_collection_cards y player_card_progress a escritura service-role, pero
-- NO tocó `player_progress` (la tabla del progreso GLOBAL: medallas, capítulo y `player_experience`). Resultado
-- vivo en producción: `authenticated` conserva GRANT de INSERT/UPDATE + policies "…_own" sobre su propia fila,
-- así que cualquiera puede subirse `player_experience` con un PATCH directo a la API REST desde la consola.
--
-- Hoy es inocuo (la XP no compra nada). Pero la ficha 8 (árbol de habilidades) deriva los PUNTOS de habilidad
-- de `player_experience` → sin este cierre, inflar la XP = desbloquear todo el árbol. Es la vuln de la cartera
-- otra vez. Se cierra ANTES de montar los puntos.
--
-- ⚠️ ORDEN DE DESPLIEGUE (OBLIGATORIO — es lo que rompió el cierre anterior):
--   1º DESPLEGAR el código que escribe con service-role (SupabasePlayerProgressRepository → writeClient).
--   2º SOLO DESPUÉS aplicar esta migración.
-- Si se cierra la tabla ANTES de desplegar el código, el código VIVO todavía escribe `player_progress` con el
-- cliente de SESIÓN → la BD lo rechaza → deja de guardarse XP/medallas/capítulo/flags en producción (el bug de
-- "no se guarda la experiencia"). Con el orden correcto no hay ventana rota: el código nuevo escribe con
-- service-role tanto si la tabla está abierta como cerrada.
--
-- Requisito previo (ya en el código): SupabasePlayerProgressRepository escribe con service-role
-- (resolve-privileged-write-client.ts), igual que cartera/colección. El jugador conserva la LECTURA de su fila
-- (policy player_progress_select_own intacta). Los escritores (story/training/tutorial/onboarding completion +
-- GetOrCreate) son todos server-side. El alta de usuario NO se ve afectada: la crea el trigger
-- `handle_new_auth_user` (SECURITY DEFINER, owner postgres), que ignora el revoke a authenticated.
begin;

drop policy if exists "player_progress_update_own" on public.player_progress;
drop policy if exists "player_progress_insert_own" on public.player_progress;
revoke insert, update, delete on public.player_progress from authenticated;

commit;

-- Comprobación posterior (debe dar false, false, true para authenticated):
--   select has_table_privilege('authenticated','public.player_progress','update') as puede_update,
--          has_table_privilege('authenticated','public.player_progress','insert') as puede_insert,
--          has_table_privilege('authenticated','public.player_progress','select') as puede_leer;
