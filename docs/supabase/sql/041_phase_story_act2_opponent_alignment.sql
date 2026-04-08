-- docs/supabase/sql/041_phase_story_act2_opponent_alignment.sql - Alinea Acto 2 al roster Helena/Soldado/BigLog y elimina presencia de Jaku.
begin;

-- Duelo intermedio central: reemplaza Jaku por Soldado para coherencia de facción en Acto 2.
update public.story_duels
set
  opponent_id = 'opp-soldier-act01',
  deck_list_id = 'deck-opp-soldier-act01-v1',
  title = 'Escuadrón de Interferencia',
  description = 'Unidad de soldado que presiona tempo y castiga errores de posicionamiento.'
where id = 'story-ch2-duel-3';

-- Boss del acto: cierre de facción con Helena.
update public.story_duels
set
  opponent_id = 'opp-helena',
  deck_list_id = 'deck-opp-helena-v1',
  title = 'Helena: Núcleo de Control',
  description = 'Combate final del Valle Visual tras sincronizar el puente principal.'
where id = 'story-ch2-duel-7';

-- Refuerzo defensivo: si quedara algún duelo de Acto 2 con Jaku activo, desactívalo.
update public.story_duels
set is_active = false
where chapter = 2
  and opponent_id = 'opp-jaku'
  and id not in ('story-ch2-duel-7')
  and is_active = true;

commit;
