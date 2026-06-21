-- docs/supabase/sql/050_phase_grant_api_roles_table_privileges.sql
-- En versiones recientes de Supabase local, las tablas creadas por migraciones NO heredan
-- automáticamente los privilegios para los roles de la API (anon/authenticated). Resultado:
-- "permission denied for table" (42501) al leer/escribir desde la app, aunque las políticas RLS
-- sean correctas (el GRANT de tabla y la política RLS son dos capas distintas; hacen falta ambas).
-- Producción y versiones antiguas de Supabase no lo notan porque concedían estos privilegios por
-- defecto. Aquí los concedemos de forma explícita e independiente de la versión.
--
-- La seguridad por fila la siguen aplicando las políticas RLS de cada tabla; el GRANT solo permite
-- que el rol "toque" la tabla, las filas visibles las decide RLS.

grant usage on schema public to anon, authenticated;

-- Tablas existentes.
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Tablas/secuencias futuras creadas en este esquema.
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
