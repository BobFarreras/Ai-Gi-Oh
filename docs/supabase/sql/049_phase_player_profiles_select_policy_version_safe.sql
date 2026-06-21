-- docs/supabase/sql/049_phase_player_profiles_select_policy_version_safe.sql
-- La política de lectura de perfiles (048) usaba auth.role() = 'authenticated'. En versiones
-- recientes de Supabase local esa función cambió/desapareció y su evaluación hace fallar el SELECT
-- entero (el perfil se guarda con INSERT, pero no se puede leer). Producción y máquinas con una
-- versión antigua de Supabase no lo notan; un contribuidor con instalación nueva sí.
--
-- La reescribimos apuntando al ROL de Postgres `authenticated`, que Supabase configura en TODAS
-- las versiones, de modo que la lectura de perfiles sea independiente de la versión.

drop policy if exists "player_profiles_select_authenticated" on public.player_profiles;

create policy "player_profiles_select_authenticated"
  on public.player_profiles
  for select
  to authenticated
  using (true);
