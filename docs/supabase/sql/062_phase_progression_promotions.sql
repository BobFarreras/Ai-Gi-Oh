-- docs/supabase/sql/062_phase_progression_promotions.sql - Noticias/promociones destacadas (F4). Config temporal editable por admin, solo lectura para jugadores.
begin;

create table if not exists public.featured_promotions (
  id text primary key,
  kind text not null check (kind in ('PACK', 'CARD', 'EVENT', 'NEWS')),
  title text not null,
  body text,
  media_url text,
  cta_label text,
  cta_href text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

alter table public.featured_promotions enable row level security;

drop policy if exists "promotions_select_all" on public.featured_promotions;
create policy "promotions_select_all" on public.featured_promotions for select to authenticated using (true);

revoke all on public.featured_promotions from anon, authenticated;
grant select on public.featured_promotions to authenticated;
grant all on public.featured_promotions to service_role;

insert into public.featured_promotions (id, kind, title, body, cta_label, cta_href, sort_order) values
  ('promo-event-launch', 'EVENT', 'Evento de Lanzamiento activo', 'Gana Fragmentos jugando y canjéalos por cartas exclusivas en la tienda de evento.', 'Jugar ahora', '/hub', 1),
  ('promo-market', 'PACK', 'Nuevos sobres en el Mercado', 'Abre sobres para ampliar tu colección y reforzar tu mazo.', 'Ir al Mercado', '/hub/market', 2),
  ('promo-multiplayer', 'NEWS', 'Demuestra quién manda', 'Gana combates multijugador, sube tu ELO y completa misiones semanales.', 'Multijugador', '/hub/multiplayer', 3)
on conflict (id) do nothing;

commit;
