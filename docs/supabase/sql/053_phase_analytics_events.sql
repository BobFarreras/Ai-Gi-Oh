-- docs/supabase/sql/053_phase_analytics_events.sql - Crea tablas de telemetría/analytics con RLS estricta (solo service_role inserta, solo admin lee).
begin;

-- Tabla principal de eventos crudos de analytics.
create table if not exists public.analytics_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  event_name text not null,
  event_category text not null check (event_category in ('navigation', 'gameplay', 'shop', 'social', 'system')),
  properties jsonb not null default '{}'::jsonb,
  page_url text,
  device_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Tabla de sesiones de usuario para métricas de duración y retención.
create table if not exists public.analytics_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  page_views integer not null default 0,
  events_count integer not null default 0,
  device_type text,
  browser text,
  os text,
  referrer text,
  is_pwa boolean not null default false
);

create index if not exists idx_analytics_events_user_id on public.analytics_events (user_id);
create index if not exists idx_analytics_events_event_name on public.analytics_events (event_name);
create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_category on public.analytics_events (event_category);
create index if not exists idx_analytics_events_session on public.analytics_events (session_id);

create index if not exists idx_analytics_sessions_user on public.analytics_sessions (user_id);
create index if not exists idx_analytics_sessions_started on public.analytics_sessions (started_at desc);

alter table public.analytics_events enable row level security;
alter table public.analytics_sessions enable row level security;

-- Sin política de INSERT para anon/authenticated: solo service_role (via endpoint API) puede insertar.

-- Admin puede leer eventos de analytics.
drop policy if exists "analytics_events_admin_read" on public.analytics_events;
create policy "analytics_events_admin_read"
on public.analytics_events
for select
to authenticated
using (
  exists (select 1 from public.admin_users where user_id = auth.uid() and is_active = true)
);

-- Admin puede leer sesiones de analytics.
drop policy if exists "analytics_sessions_admin_read" on public.analytics_sessions;
create policy "analytics_sessions_admin_read"
on public.analytics_sessions
for select
to authenticated
using (
  exists (select 1 from public.admin_users where user_id = auth.uid() and is_active = true)
);

-- Defensa en profundidad: revocar los grants por defecto de Supabase (anon/authenticated
-- reciben ALL en tablas nuevas vía default privileges). Hoy RLS ya bloquea el acceso, pero
-- sin estos REVOKE una desactivación accidental de RLS expondría escritura/lectura pública.
revoke all on public.analytics_events from anon;
revoke all on public.analytics_sessions from anon;
revoke insert, update, delete, truncate, references, trigger on public.analytics_events from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.analytics_sessions from authenticated;

-- Grants: service_role tiene acceso total (bypassa RLS). Admin solo lectura (SELECT + policy).
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
grant select on public.analytics_sessions to authenticated;
grant all on public.analytics_sessions to service_role;

commit;
