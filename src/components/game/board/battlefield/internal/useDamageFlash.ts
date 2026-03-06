import { useEffect, useState } from "react";

export function useDamageFlash(shouldDamageFlash: boolean, damageEventId: string | null): boolean {
  const [isDamageFlashing, setIsDamageFlashing] = useState(false);

  useEffect(() => {
    if (!shouldDamageFlash || !damageEventId) return;
    const startId = setTimeout(() => setIsDamageFlashing(true), 0);
    const timeoutId = setTimeout(() => setIsDamageFlashing(false), 850);
    return () => {
      clearTimeout(startId);
      clearTimeout(timeoutId);
    };
  }, [damageEventId, shouldDamageFlash]);

  return isDamageFlashing;
}
