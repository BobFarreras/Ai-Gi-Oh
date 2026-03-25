-- docs/supabase/sql/026_phase_admin_security_foundation.sql - Crea base de autorización y auditoría para el módulo administrativo.
begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('ADMIN', 'SUPER_ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id text primary key,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_users_active on public.admin_users (is_active);
create index if not exists idx_admin_audit_log_actor_created on public.admin_audit_log (actor_user_id, created_at desc);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "admin_users_select_own_active" on public.admin_users;
create policy "admin_users_select_own_active"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id and is_active = true);

drop policy if exists "admin_audit_log_select_own" on public.admin_audit_log;
create policy "admin_audit_log_select_own"
on public.admin_audit_log
for select
to authenticated
using (auth.uid() = actor_user_id);

drop policy if exists "admin_audit_log_insert_own" on public.admin_audit_log;
create policy "admin_audit_log_insert_own"
on public.admin_audit_log
for insert
to authenticated
with check (auth.uid() = actor_user_id);

grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;
grant select, insert on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;

commit;
