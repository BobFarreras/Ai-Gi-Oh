-- docs/supabase/sql/144_rename_mouretech_to_midutech.sql
-- Renombra el oponente de arena Mouretech -> Midutech (id, code_name, display_name, story_opponent_id, rutas de
-- assets y variantes) para alinear la BD con el renombrado del repo. Patrón SEGURO insert->repuntar tiers->borrar
-- (no toca FKs). Idempotente: si ya existe 'training-midutech' o no existe 'training-mouretech', no hace nada.
-- Aplicada a producción el 2026-07-21.
do $$
begin
  if not exists (select 1 from arena_opponents where id='training-midutech')
     and exists (select 1 from arena_opponents where id='training-mouretech') then

    insert into arena_opponents (id, code_name, display_name, avatar_url, intro_url, story_opponent_id, is_active, sort_order, updated_at)
    select 'training-midutech', 'midutech', 'Midutech',
           replace(replace(avatar_url,'opp-ch1-mouretech','opp-ch1-midutech'),'Mouretech','Midutech'),
           replace(replace(intro_url,'opp-ch1-mouretech','opp-ch1-midutech'),'Mouretech','Midutech'),
           'opp-midutech', is_active, sort_order, now()
    from arena_opponents where id='training-mouretech';

    insert into arena_opponent_deck_variants (id, opponent_id, label, sort_order, is_active, updated_at)
    select replace(id,'mouretech','midutech'), 'training-midutech', replace(label,'Mouretech','Midutech'), sort_order, is_active, now()
    from arena_opponent_deck_variants where opponent_id='training-mouretech';

    insert into arena_deck_variant_cards (variant_id, card_id, zone, version_tier, level, xp, sort_order, attack_bonus, defense_bonus)
    select replace(variant_id,'mouretech','midutech'), card_id, zone, version_tier, level, xp, sort_order, attack_bonus, defense_bonus
    from arena_deck_variant_cards where variant_id in ('mouretech-offense','mouretech-control');

    update arena_tiers set opponent_id='training-midutech' where opponent_id='training-mouretech';

    delete from arena_deck_variant_cards where variant_id in ('mouretech-offense','mouretech-control');
    delete from arena_opponent_deck_variants where opponent_id='training-mouretech';
    delete from arena_opponents where id='training-mouretech';
  end if;
end $$;
