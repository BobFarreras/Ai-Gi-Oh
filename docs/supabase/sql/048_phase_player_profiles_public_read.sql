-- docs/supabase/sql/048_phase_player_profiles_public_read.sql
-- Permite a cualquier usuario autenticado leer perfiles públicos de otros jugadores.
-- Sin esta política, los nicknames de rivales no se muestran en invitaciones,
-- ranking ni lobby multijugador (RLS bloqueaba la lectura a uid = player_id).

create policy "player_profiles_select_authenticated"
  on public.player_profiles
  for select
  using (auth.role() = 'authenticated');
