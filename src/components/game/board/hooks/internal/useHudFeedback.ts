// src/components/game/board/hooks/internal/useHudFeedback.ts - Gestiona feedback temporal de daño y curación en HUD sin duplicar eventos.
import { useState, useEffect, useRef } from "react";

export function useHudFeedback(
  wasDamagedThisAction: boolean,
  damagePulseKey: string | null,
  damageAmount: number | null,
  wasHealedThisAction: boolean,
  healPulseKey: string | null,
  healAmount: number | null
) {
  const lastProcessedDamageEventId = useRef<string | null>(null);
  const lastProcessedHealEventId = useRef<string | null>(null);
  
  const [damageTaken, setDamageTaken] = useState<number | null>(null);
  const [healGained, setHealGained] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Daño
  useEffect(() => {
    if (!wasDamagedThisAction || !damagePulseKey || lastProcessedDamageEventId.current === damagePulseKey) return;
    const damage = damageAmount ?? 0;
    if (damage <= 0) return;

    lastProcessedDamageEventId.current = damagePulseKey;
    
    // FIX: Empujamos el setState fuera del ciclo síncrono de renderizado
    const startTimer = setTimeout(() => {
      setDamageTaken(damage);
      setIsShaking(true);
    }, 0);

    const endTimer = setTimeout(() => {
      setDamageTaken(null);
      setIsShaking(false);
    }, 1500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [damageAmount, damagePulseKey, wasDamagedThisAction]);

  // Cura
  useEffect(() => {
    if (!wasHealedThisAction || !healPulseKey || lastProcessedHealEventId.current === healPulseKey) return;
    const heal = healAmount ?? 0;
    if (heal <= 0) return;

    lastProcessedHealEventId.current = healPulseKey;
    
    const startTimer = setTimeout(() => setHealGained(heal), 0);
    const endTimer = setTimeout(() => setHealGained(null), 1500);
    
    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [healAmount, healPulseKey, wasHealedThisAction]);

  return { damageTaken, healGained, isShaking };
}
