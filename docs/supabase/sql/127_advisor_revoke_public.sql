-- docs/supabase/sql/127_advisor_revoke_public.sql
-- 🩹 Corrige la 126: allí revoqué `execute ... from anon`, pero en Postgres las funciones nacen con un
-- GRANT EXECUTE implícito a PUBLIC, y `anon`/`authenticated` heredan de PUBLIC. Revocar solo de `anon` no quita
-- nada mientras PUBLIC conserve el permiso. Hay que revocar de PUBLIC y dejar solo los grants explícitos.
--
-- ACL antes (ejemplo): {=X/postgres, postgres=X, authenticated=X, service_role=X}  ← el `=X` es PUBLIC.
begin;

-- RPC de usuario logueado: quitar PUBLIC (→ anon fuera); authenticated y service_role conservan su grant propio.
revoke execute on function public.award_weekly_points(text[], integer) from public;
revoke execute on function public.dm_get_or_create_conversation(uuid)   from public;

-- Server-only: quitar PUBLIC (→ anon y authenticated fuera); solo queda el grant explícito a service_role.
revoke execute on function public.find_or_create_match(uuid, text[])    from public;

-- Trigger de alta de usuario: nadie debe poder invocarla como RPC (el trigger corre como dueño de la tabla).
revoke execute on function public.handle_new_auth_user()                from public;

commit;

-- Comprobación: has_function_privilege('anon', …) = false en las 4; y ('authenticated', find_or_create_match) = false.
