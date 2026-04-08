-- docs/security/sql/2026-04-03-supabase-rls-verification.sql - Consultas de verificación para confirmar RLS activa y privilegios mínimos tras hardening.
-- 1) Tablas de public sin RLS activa (debe devolver 0 filas).
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and rowsecurity is distinct from true;

-- 2) Permisos directos de anon/authenticated por tabla (revisar que no aparezca DELETE ni privilegios inesperados).
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 3) Políticas RLS con USING/WITH CHECK para trazabilidad.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
