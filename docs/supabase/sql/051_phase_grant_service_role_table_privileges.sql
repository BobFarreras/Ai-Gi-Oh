-- docs/supabase/sql/051_phase_grant_service_role_table_privileges.sql
-- El rol service_role (usado por createSupabaseServiceRoleClient en server-side)
-- tiene bypassrls=true, pero en Supabase local NO hereda automáticamente los
-- privilegios de tabla (SELECT/INSERT/UPDATE/DELETE). Resultado: "permission
-- denied for table match_sessions" (42501) al leer sesiones de partida desde
-- el server component, aunque bypassrls debería bastar. Producción no lo
-- notaba porque versiones antiguas de Supabase concedían estos privilegios
-- por defecto. Aquí los concedemos de forma explícita e independiente de la
-- versión, igual que la fase 050 hizo para anon/authenticated.
--
-- La seguridad por fila la sigue decidiendo RLS; bypassrls la ignora, pero el
-- GRANT es la capa previa obligatoria para que el rol pueda "tocar" la tabla.

-- Tablas existentes: conceder todos los privilegios de tabla a service_role.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Tablas/secuencias futuras creadas en este esquema.
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
