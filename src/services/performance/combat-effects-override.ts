// src/services/performance/combat-effects-override.ts - Lectura/escritura centralizada del override manual de efectos visuales con notificación por evento.

/** Override manual del perfil de efectos: null = auto-detección. */
export type CombatEffectsOverride = "reduced" | "full" | null;

/** Clave compartida de localStorage para el override del jugador. */
export const COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY = "combat-effects-profile";

/** Evento global emitido al cambiar el override para re-sincronizar hooks montados. */
export const COMBAT_EFFECTS_OVERRIDE_EVENT = "combat-effects-profile-changed";

/** Lee el override persistido; tolera entornos sin localStorage (SSR, privacidad). */
export function readCombatEffectsOverride(): CombatEffectsOverride {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY);
    return value === "reduced" || value === "full" ? value : null;
  } catch {
    return null;
  }
}

/** Persiste el override (null lo elimina) y notifica a los listeners del juego. */
export function writeCombatEffectsOverride(value: CombatEffectsOverride): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY, value);
    }
  } catch {
    // Sin almacenamiento disponible: el evento sigue propagando el cambio en memoria.
  }
  window.dispatchEvent(new CustomEvent(COMBAT_EFFECTS_OVERRIDE_EVENT, { detail: { override: value } }));
}

/** Cicla el override para el botón de pruebas: auto → reducido → completo → auto. */
export function cycleCombatEffectsOverride(current: CombatEffectsOverride): CombatEffectsOverride {
  if (current === null) return "reduced";
  if (current === "reduced") return "full";
  return null;
}
