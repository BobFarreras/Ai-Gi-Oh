// src/components/admin/internal/pve/AdminOlympusSettingsPanel.tsx - Publica versiones de la configuración de Olimpo (intentos, caducidad y respec).
"use client";

import { useState } from "react";
import { IPublishOlympusSettingsCommand } from "@/core/entities/admin/IAdminPveModes";
import { AdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";
import { AdminPveVersionHistory } from "@/components/admin/internal/pve/AdminPveVersionHistory";
import {
  PVE_FIELD, PVE_GHOST_BUTTON, PVE_LABEL, PVE_SAVE_BUTTON, PVE_SECTION, PVE_TITLE,
} from "@/components/admin/internal/pve/admin-pve-styles";

const FIELDS: { key: keyof IPublishOlympusSettingsCommand; label: string; hint: string }[] = [
  { key: "dailyAttemptLimit", label: "Intentos por día", hint: "Se reinician a las 00:00 UTC." },
  { key: "battleTtlMinutes", label: "Caducidad (min)", hint: "Pasado ese tiempo, abandonar cuenta como derrota." },
  { key: "respecFreeAllowance", label: "Respecs gratis", hint: "Reasignaciones sin coste por campeón." },
  { key: "respecCost", label: "Coste de respec", hint: "Fragmentos que cuesta a partir de la gratuita." },
  { key: "respecRefundPercent", label: "Reembolso (%)", hint: "Porcentaje de lo invertido que se devuelve." },
];

const DEFAULTS: IPublishOlympusSettingsCommand = {
  dailyAttemptLimit: 3, battleTtlMinutes: 45, respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 75,
};

export function AdminOlympusSettingsPanel({ modes }: { modes: AdminPveModes }) {
  const active = modes.olympusSettings.find((settings) => settings.isActive);
  const [draft, setDraft] = useState<IPublishOlympusSettingsCommand | null>(null);
  const current: IPublishOlympusSettingsCommand = draft ?? (active
    ? {
      dailyAttemptLimit: active.dailyAttemptLimit, battleTtlMinutes: active.battleTtlMinutes,
      respecFreeAllowance: active.respecFreeAllowance, respecCost: active.respecCost,
      respecRefundPercent: active.respecRefundPercent,
    }
    : DEFAULTS);

  return (
    <div className="home-modern-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <section className={PVE_SECTION}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className={PVE_TITLE}>Configuración · versión activa v{active?.version ?? "—"}</h2>
          <p className="text-[10px] text-slate-500">El cliente nunca decide estos valores: viajan firmados desde el servidor.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {FIELDS.map((field) => (
            <label key={field.key} className="space-y-1">
              <span className={PVE_LABEL}>{field.label}</span>
              <input
                aria-label={field.label}
                className={`${PVE_FIELD} w-full`}
                inputMode="numeric"
                value={current[field.key]}
                onChange={(event) => setDraft({ ...current, [field.key]: Number(event.target.value) || 0 })}
              />
              <span className="block text-[9.5px] text-slate-500">{field.hint}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" aria-label="Publicar nueva versión de la configuración" className={PVE_SAVE_BUTTON} disabled={modes.isBusy}
            onClick={() => void modes.publishOlympusSettings(current).then((ok) => ok && setDraft(null))}>
            Publicar versión
          </button>
          {draft ? (
            <button type="button" aria-label="Descartar cambios de configuración" className={PVE_GHOST_BUTTON} onClick={() => setDraft(null)}>Descartar</button>
          ) : null}
        </div>
      </section>

      <AdminPveVersionHistory
        title="Historial de configuración"
        rows={modes.olympusSettings.map((settings) => ({
          version: settings.version,
          isActive: settings.isActive,
          publishedAtIso: settings.publishedAtIso,
          summary: `${settings.dailyAttemptLimit} intentos · TTL ${settings.battleTtlMinutes} min · respec ${settings.respecCost} (${settings.respecRefundPercent}% reembolso)`,
        }))}
      />
    </div>
  );
}
