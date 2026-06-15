// src/services/performance/combat-effects-override.test.ts - Verifica persistencia, ciclo y notificación del override de efectos visuales.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMBAT_EFFECTS_OVERRIDE_EVENT,
  COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY,
  cycleCombatEffectsOverride,
  readCombatEffectsOverride,
  writeCombatEffectsOverride,
} from "./combat-effects-override";

describe("combat-effects-override", () => {
  afterEach(() => {
    window.localStorage.removeItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY);
  });

  it("lee null cuando no hay override o el valor es inválido", () => {
    expect(readCombatEffectsOverride()).toBeNull();
    window.localStorage.setItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY, "rubbish");
    expect(readCombatEffectsOverride()).toBeNull();
  });

  it("persiste y elimina el override en localStorage", () => {
    writeCombatEffectsOverride("reduced");
    expect(readCombatEffectsOverride()).toBe("reduced");
    writeCombatEffectsOverride("full");
    expect(readCombatEffectsOverride()).toBe("full");
    writeCombatEffectsOverride(null);
    expect(window.localStorage.getItem(COMBAT_EFFECTS_OVERRIDE_STORAGE_KEY)).toBeNull();
  });

  it("notifica el cambio con un evento global", () => {
    const listener = vi.fn();
    window.addEventListener(COMBAT_EFFECTS_OVERRIDE_EVENT, listener);
    writeCombatEffectsOverride("reduced");
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(COMBAT_EFFECTS_OVERRIDE_EVENT, listener);
  });

  it("cicla auto → reducido → completo → auto", () => {
    expect(cycleCombatEffectsOverride(null)).toBe("reduced");
    expect(cycleCombatEffectsOverride("reduced")).toBe("full");
    expect(cycleCombatEffectsOverride("full")).toBeNull();
  });
});
