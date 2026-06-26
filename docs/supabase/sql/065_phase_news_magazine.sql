-- docs/supabase/sql/065_phase_news_magazine.sql - Amplía los tipos de novedad (sistema, mantenimiento, historia), añade imágenes y noticias de ejemplo para el formato revista.
begin;

alter table public.featured_promotions drop constraint if exists featured_promotions_kind_check;
alter table public.featured_promotions
  add constraint featured_promotions_kind_check
  check (kind in ('PACK', 'CARD', 'EVENT', 'NEWS', 'SYSTEM', 'MAINTENANCE', 'STORY'));

-- Imágenes + temática de lanzamiento en las promos existentes.
update public.featured_promotions
  set media_url = '/assets/bgs/bg-tech.webp',
      body = 'Arranca AI-GI-OH: el Evento de Lanzamiento ya está aquí. Juega, consigue Fragmentos y canjéalos por cartas exclusivas antes de que termine.'
  where id = 'promo-event-launch';
update public.featured_promotions set media_url = '/assets/renders/python.webp' where id = 'promo-market';

-- Noticias de ejemplo de los nuevos tipos (el admin las editará).
insert into public.featured_promotions (id, kind, title, body, media_url, cta_label, cta_href, sort_order) values
  ('promo-new-cards', 'CARD', 'Nuevas cartas en circulación', 'Se han añadido nuevas entidades y trampas al catálogo. Búscalas en el mercado y en los sobres.', '/assets/renders/flutter.webp', 'Ver mercado', '/hub/market', 4),
  ('promo-story-chapter', 'STORY', 'Nuevo capítulo de la historia', 'BigLog ha desbloqueado un nuevo tramo del mapa Story. Nuevos rivales te esperan.', '/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp', 'Ir a Story', '/hub/story', 5),
  ('promo-maintenance', 'MAINTENANCE', 'Mantenimiento programado', 'Habrá una breve ventana de mantenimiento esta semana para mejorar el rendimiento del multijugador. Avisaremos del horario exacto.', null, null, null, 6),
  ('promo-system-incident', 'SYSTEM', 'Incidencia resuelta', 'Detectamos y corregimos un fallo que impedía sumar puntos al comprar sobres. Ya está solucionado. ¡Gracias por avisar!', null, null, null, 7)
on conflict (id) do nothing;

commit;
