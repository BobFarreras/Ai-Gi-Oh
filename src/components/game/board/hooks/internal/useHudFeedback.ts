// src/components/game/board/hooks/internal/useHudFeedback.ts - Gestiona feedback temporal de daño y curación en HUD sin duplicar eventos.
import { useState, useEffect, useRef } from "react";
import { DIRECT_DAMAGE_IMPACT_MS } from "@/core/config/direct-damage-vfx";

export function useHudFeedback(
  wasDamagedThisAction: boolean,
  damagePulseKey: string | null,
  damageAmount: number | null,
  wasHealedThisAction: boolean,
  healPulseKey: string | null,
  healAmount: number | null,
  wasEnergyGainedThisAction: boolean,
  energyPulseKey: string | null,
  energyAmount: number | null,
) {
  const lastProcessedDamageEventId = useRef<string | null>(null);
  const lastProcessedHealEventId = useRef<string | null>(null);
  const lastProcessedEnergyEventId = useRef<string | null>(null);
  const [damageTaken, setDamageTaken] = useState<number | null>(null);
  const [healGained, setHealGained] = useState<number | null>(null);
  const [energyGained, setEnergyGained] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Daño
  useEffect(() => {
    if (!wasDamagedThisAction || !damagePulseKey || lastProcessedDamageEventId.current === damagePulseKey) return;
    const damage = damageAmount ?? 0;
    if (damage <= 0) return;
    lastProcessedDamageEventId.current = damagePulseKey;
    const startTimer = setTimeout(() => {
      setDamageTaken(damage);
      setIsShaking(true);
    }, DIRECT_DAMAGE_IMPACT_MS);
    const endTimer = setTimeout(() => {
      setDamageTaken(null);
      setIsShaking(false);
    }, DIRECT_DAMAGE_IMPACT_MS + 1500);
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

  // Energía
  useEffect(() => {
    if (!wasEnergyGainedThisAction || !energyPulseKey || lastProcessedEnergyEventId.current === energyPulseKey) return;
    const energy = energyAmount ?? 0;
    if (energy <= 0) return;
    lastProcessedEnergyEventId.current = energyPulseKey;
    const startTimer = setTimeout(() => setEnergyGained(energy), 0);
    const endTimer = setTimeout(() => setEnergyGained(null), 1650);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [energyAmount, energyPulseKey, wasEnergyGainedThisAction]);

  return { damageTaken, healGained, energyGained, isShaking };
}
