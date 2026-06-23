-- docs/supabase/sql/056_phase_analytics_user_emails.sql - Resuelve emails de usuarios para el panel admin de analytics. SECURITY DEFINER restringido a service_role (los emails nunca se exponen a anon/authenticated).
begin;

create or replace function public.analytics_user_emails(p_ids uuid[])
returns table(user_id uuid, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text
  from auth.users u
  where u.id = any(p_ids);
$$;

-- Email es PII: solo service_role (server-side, clave secreta) puede ejecutar esta función.
revoke all on function public.analytics_user_emails(uuid[]) from public, anon, authenticated;
grant execute on function public.analytics_user_emails(uuid[]) to service_role;

commit;
