-- docs/supabase/sql/119_card_max_level_art.sql
-- Arte alternativo al alcanzar el nivel máximo (ficha 4 del paquete v1.15).
--
-- La carta estrena imagen al llegar al nivel 100. Como todavía no existen las imágenes, la columna nace NULL y
-- el render cae al `render_url` de siempre: el sistema queda configurado hoy y las imágenes se suben cuando
-- estén, sin tocar una línea de código.
--
-- El intercambio lo hace `applyCardProgressionToCard`, que es el único punto por el que pasan todas las cartas
-- antes de entrar en combate: así lo ven el tablero, el arsenal y los DOS clientes de una partida multijugador.
begin;

alter table public.cards_catalog
  add column if not exists render_url_max_level text;

comment on column public.cards_catalog.render_url_max_level is
  'Arte alternativo que la carta estrena al llegar al nivel máximo (100). NULL = usa render_url.';

commit;
