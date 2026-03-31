// src/core/config/direct-damage-vfx.ts - Define timings compartidos para sincronizar rayo de daño directo, audio y feedback HUD.
export const DIRECT_DAMAGE_CHARGE_MS = 260;
export const DIRECT_DAMAGE_BEAM_MS = 130;
export const DIRECT_DAMAGE_BEAM_START_MS = DIRECT_DAMAGE_CHARGE_MS;
export const DIRECT_DAMAGE_IMPACT_MS = DIRECT_DAMAGE_CHARGE_MS + DIRECT_DAMAGE_BEAM_MS;
