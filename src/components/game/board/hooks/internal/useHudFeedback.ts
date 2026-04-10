// src/components/game/board/hooks/internal/useHudFeedback.ts - Gestiona feedback temporal del HUD con timers robustos para evitar estados atascados.
import { useEffect, useRef, useState } from "react";
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
  wasEnergyLostThisAction: boolean,
  energyLossPulseKey: string | null,
  energyLossAmount: number | null,
) {
  const damageStartTimerRef = useRef<number | null>(null);
  const damageEndTimerRef = useRef<number | null>(null);
  const healTimerRef = useRef<number | null>(null);
  const energyGainTimerRef = useRef<number | null>(null);
  const energyLossTimerRef = useRef<number | null>(null);
  const lastProcessedDamageEventId = useRef<string | null>(null);
  const lastProcessedHealEventId = useRef<string | null>(null);
  const lastProcessedEnergyEventId = useRef<string | null>(null);
  const lastProcessedEnergyLossEventId = useRef<string | null>(null);
  const [damageTaken, setDamageTaken] = useState<number | null>(null);
  const [healGained, setHealGained] = useState<number | null>(null);
  const [energyGained, setEnergyGained] = useState<number | null>(null);
  const [energyLost, setEnergyLost] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => () => {
    if (damageStartTimerRef.current) window.clearTimeout(damageStartTimerRef.current);
    if (damageEndTimerRef.current) window.clearTimeout(damageEndTimerRef.current);
    if (healTimerRef.current) window.clearTimeout(healTimerRef.current);
    if (energyGainTimerRef.current) window.clearTimeout(energyGainTimerRef.current);
    if (energyLossTimerRef.current) window.clearTimeout(energyLossTimerRef.current);
  }, []);

  useEffect(() => {
    if (!wasDamagedThisAction || !damagePulseKey || lastProcessedDamageEventId.current === damagePulseKey) return;
    const damage = damageAmount ?? 0;
    if (damage <= 0) return;
    lastProcessedDamageEventId.current = damagePulseKey;
    if (damageStartTimerRef.current) window.clearTimeout(damageStartTimerRef.current);
    if (damageEndTimerRef.current) window.clearTimeout(damageEndTimerRef.current);
    damageStartTimerRef.current = window.setTimeout(() => {
      setDamageTaken(damage);
      setIsShaking(true);
    }, DIRECT_DAMAGE_IMPACT_MS);
    damageEndTimerRef.current = window.setTimeout(() => {
      setDamageTaken(null);
      setIsShaking(false);
    }, DIRECT_DAMAGE_IMPACT_MS + 2200);
  }, [damageAmount, damagePulseKey, wasDamagedThisAction]);

  useEffect(() => {
    if (!wasHealedThisAction || !healPulseKey || lastProcessedHealEventId.current === healPulseKey) return;
    const heal = healAmount ?? 0;
    if (heal <= 0) return;
    lastProcessedHealEventId.current = healPulseKey;
    if (healTimerRef.current) window.clearTimeout(healTimerRef.current);
    window.setTimeout(() => setHealGained(heal), 0);
    healTimerRef.current = window.setTimeout(() => setHealGained(null), 2200);
  }, [healAmount, healPulseKey, wasHealedThisAction]);

  useEffect(() => {
    if (!wasEnergyGainedThisAction || !energyPulseKey || lastProcessedEnergyEventId.current === energyPulseKey) return;
    const energy = energyAmount ?? 0;
    if (energy <= 0) return;
    lastProcessedEnergyEventId.current = energyPulseKey;
    if (energyGainTimerRef.current) window.clearTimeout(energyGainTimerRef.current);
    window.setTimeout(() => setEnergyGained(energy), 0);
    energyGainTimerRef.current = window.setTimeout(() => setEnergyGained(null), 2200);
  }, [energyAmount, energyPulseKey, wasEnergyGainedThisAction]);

  useEffect(() => {
    if (!wasEnergyLostThisAction || !energyLossPulseKey || lastProcessedEnergyLossEventId.current === energyLossPulseKey) return;
    const energy = energyLossAmount ?? 0;
    if (energy <= 0) return;
    lastProcessedEnergyLossEventId.current = energyLossPulseKey;
    if (energyLossTimerRef.current) window.clearTimeout(energyLossTimerRef.current);
    window.setTimeout(() => setEnergyLost(energy), 0);
    energyLossTimerRef.current = window.setTimeout(() => setEnergyLost(null), 2200);
  }, [energyLossAmount, energyLossPulseKey, wasEnergyLostThisAction]);

  return { damageTaken, healGained, energyGained, energyLost, isShaking };
}
