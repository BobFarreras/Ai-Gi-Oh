-- docs/supabase/sql/032_phase_trap_descriptions_clarity.sql - Normaliza descripciones de cartas TRAP con valores explícitos de efecto y trigger.
begin;

update public.cards_catalog
set description = case id
  when 'trap-atk-drain' then 'Cuando el rival declara ataque, reduce -300 ATK a todas sus entidades en campo.'
  when 'trap-counter-intrusion' then 'Cuando el rival declara ataque, inflige 500 de daño directo al rival.'
  when 'trap-def-fragment' then 'Cuando el rival activa una ejecución, reduce -300 DEF a todas sus entidades en campo.'
  when 'trap-force-overclock-lock' then 'Cuando el rival invoca una entidad en SET/defensa, la cambia a ATTACK y bloquea ese modo hasta que sea destruida.'
  when 'trap-gemini-counter-seal' then 'Cuando el rival activa una trampa, niega su efecto y destruye esa carta trampa.'
  when 'trap-hydra-counter' then 'Cuando el rival declara ataque, inflige 500 de daño directo al rival.'
  when 'trap-kernel-panic' then 'Cuando el rival declara ataque, niega ese ataque y destruye la entidad atacante.'
  when 'trap-mirror-buff-injection' then 'Cuando el rival aplica un buff de ATK/DEF, replica el mismo valor de buff a todas tus entidades en campo.'
  when 'trap-nexus-reset-barrier' then 'Cuando el rival declara ataque directo, su energía pasa a 0 y tu energía se fija en 10.'
  when 'trap-nullify-opponent-trap' then 'Cuando el rival activa una trampa, niega su efecto y destruye esa carta trampa.'
  when 'trap-runtime-punish' then 'Cuando el rival activa una ejecución, inflige 400 de daño directo al rival.'
  when 'trap-tor-smokescreen' then 'Cuando el rival activa una ejecución, reduce -300 ATK a todas sus entidades en campo.'
  when 'trap-windows92-crash' then 'Cuando el rival declara ataque, niega ese ataque y destruye la entidad atacante.'
  else description
end
where type = 'TRAP'
  and id in (
    'trap-atk-drain',
    'trap-counter-intrusion',
    'trap-def-fragment',
    'trap-force-overclock-lock',
    'trap-gemini-counter-seal',
    'trap-hydra-counter',
    'trap-kernel-panic',
    'trap-mirror-buff-injection',
    'trap-nexus-reset-barrier',
    'trap-nullify-opponent-trap',
    'trap-runtime-punish',
    'trap-tor-smokescreen',
    'trap-windows92-crash'
  );

commit;
