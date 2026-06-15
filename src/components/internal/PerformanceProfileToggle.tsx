// src/components/internal/PerformanceProfileToggle.tsx - Botón flotante global para alternar el perfil de efectos visuales (auto/reducido/completo).
"use client";

import { useSyncExternalStore } from "react";
import { Gauge } from "lucide-react";
import {
  COMBAT_EFFECTS_OVERRIDE_EVENT,
  CombatEffectsOverride,
  cycleCombatEffectsOverride,
  readCombatEffectsOverride,
  writeCombatEffectsOverride,
} from "@/services/performance/combat-effects-override";

/** Etiquetas visibles en español para cada estado del override. */
const OVERRIDE_LABELS: Record<"auto" | "reduced" | "full", string> = {
  auto: "Auto",
  reduced: "Mín",
  full: "Máx",
};

const OVERRIDE_DESCRIPTIONS: Record<"auto" | "reduced" | "full", string> = {
  auto: "Efectos según el dispositivo (auto-detección)",
  reduced: "Efectos mínimos forzados (modo rendimiento)",
  full: "Efectos completos forzados",
};

/** Suscripción al evento global de cambio de override (emitido por el servicio). */
function subscribeToOverrideChanges(onStoreChange: () => void): () => void {
  window.addEventListener(COMBAT_EFFECTS_OVERRIDE_EVENT, onStoreChange);
  return () => window.removeEventListener(COMBAT_EFFECTS_OVERRIDE_EVENT, onStoreChange);
}

/** Snapshot de servidor: sin localStorage el override siempre es auto (null). */
function getServerOverrideSnapshot(): CombatEffectsOverride {
  return null;
}

/**
 * Botón de pruebas accesible en todo el juego: cicla auto → reducido → completo.
 * Lee el override como store externo para mantenerse hidratación-seguro.
 */
export function PerformanceProfileToggle() {
  const override = useSyncExternalStore(subscribeToOverrideChanges, readCombatEffectsOverride, getServerOverrideSnapshot);
  const labelKey: "auto" | "reduced" | "full" = override ?? "auto";
  const isForced = override !== null;

  return (
    <button
      type="button"
      onClick={() => writeCombatEffectsOverride(cycleCombatEffectsOverride(override))}
      aria-label={`Perfil de efectos visuales: ${OVERRIDE_DESCRIPTIONS[labelKey]}. Pulsar para cambiar.`}
      title={OVERRIDE_DESCRIPTIONS[labelKey]}
      className={`fixed bottom-3 left-3 z-[9999] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-widest backdrop-blur-sm transition-colors ${
        isForced
          ? "border-amber-400/70 bg-amber-950/80 text-amber-200 hover:bg-amber-900/80"
          : "border-cyan-700/60 bg-slate-950/80 text-cyan-300 hover:bg-slate-900/80"
      }`}
    >
      <Gauge size={14} aria-hidden />
      <span>FX: {OVERRIDE_LABELS[labelKey]}</span>
    </button>
  );
}
