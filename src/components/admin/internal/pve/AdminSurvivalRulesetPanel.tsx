// src/components/admin/internal/pve/AdminSurvivalRulesetPanel.tsx - Publica versiones del ruleset de Supervivencia con vista previa del escalado.
"use client";

import { useState } from "react";
import { IAdminSurvivalRuleset } from "@/core/entities/admin/IAdminPveModes";
import { AdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";
import { AdminPveHelpNote } from "@/components/admin/internal/pve/AdminPveHelpNote";
import { AdminPveVersionHistory } from "@/components/admin/internal/pve/AdminPveVersionHistory";
import { AdminSurvivalPreview } from "@/components/admin/internal/pve/AdminSurvivalPreview";
import { AdminSurvivalRosterEditor } from "@/components/admin/internal/pve/AdminSurvivalRosterEditor";
import { AdminSurvivalStageEditor } from "@/components/admin/internal/pve/AdminSurvivalStageEditor";
import { SurvivalDraft } from "@/components/admin/internal/pve/admin-survival-preview";
import {
  PVE_FIELD, PVE_GHOST_BUTTON, PVE_SAVE_BUTTON, PVE_SECTION, PVE_TITLE,
} from "@/components/admin/internal/pve/admin-pve-styles";

const DEFAULT_DRAFT: SurvivalDraft = {
  startTier: 4, battlesPerTier: 2, roster: [], milestoneInterval: 5, milestoneHeal: 2000,
  stages: [{ fromBattle: 1, aiProfile: "HARD", maxTier: 8, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "survival-base" }],
};

function toDraft(active: IAdminSurvivalRuleset | undefined): SurvivalDraft {
  if (!active) return DEFAULT_DRAFT;
  const { startTier, battlesPerTier, roster, milestoneInterval, milestoneHeal, stages } = active;
  return {
    startTier, battlesPerTier, milestoneInterval, milestoneHeal,
    roster: [...roster], stages: stages.map((stage) => ({ ...stage })),
  };
}

const BASE_FIELDS: { key: "startTier" | "battlesPerTier" | "milestoneInterval" | "milestoneHeal"; label: string; hint: string }[] = [
  { key: "startTier", label: "Tier inicial", hint: "Fuerza del rival en el primer combate." },
  { key: "battlesPerTier", label: "Combates por tier", hint: "Cada N combates el rival sube un tier." },
  { key: "milestoneInterval", label: "Hito cada N victorias", hint: "Cadencia de la curación." },
  { key: "milestoneHeal", label: "LP que cura el hito", hint: "Nunca supera los LP máximos." },
];

export function AdminSurvivalRulesetPanel({ modes }: { modes: AdminPveModes }) {
  const active = modes.survivalRulesets.find((ruleset) => ruleset.isActive);
  const [draft, setDraft] = useState<SurvivalDraft | null>(null);
  const current = draft ?? toDraft(active);
  const edit = (patch: Partial<SurvivalDraft>) => setDraft({ ...current, ...patch });

  return (
    <div className="home-modern-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <AdminPveHelpNote
        title="Cómo escala una expedición"
        steps={[
          "El jugador encadena combates con sus LP reales: lo que le queda al ganar es con lo que empieza el siguiente. Perder o empatar cierra la expedición.",
          "El rival del combate N sale del roster en orden circular: el combate 1 es el primero de la lista, y al acabar la vuelta se vuelve a empezar.",
          "La fuerza sube por tiers: cada «combates por tier» el rival gana un tier, empezando en el «tier inicial».",
          "Cada tramo fija la dificultad de la IA y el tier máximo. Al tocar ese tope el rival deja de subir de tier y arranca la Ascensión.",
          "En Ascensión, cada vuelta completa al roster suma los LP y el ATK/DEF extra del tramo. Es el crecimiento acotado que sustituye al tier.",
          "Cada «hito» de victorias devuelve LP al jugador, sin pasar de su máximo.",
        ]}
      />

      <section className={PVE_SECTION}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className={PVE_TITLE}>Reglas base · versión activa v{active?.version ?? "—"}</h2>
          <p className="text-[10px] text-slate-500">Guardar publica una versión nueva; las expediciones en curso conservan la suya.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {BASE_FIELDS.map((field) => (
            <label key={field.key} className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{field.label}</span>
              <input
                aria-label={field.label}
                className={`${PVE_FIELD} w-full`}
                inputMode="numeric"
                value={current[field.key]}
                onChange={(event) => edit({ [field.key]: Number(event.target.value) || 0 })}
              />
              <span className="block text-[9.5px] text-slate-500">{field.hint}</span>
            </label>
          ))}
        </div>
      </section>

      <section className={PVE_SECTION}>
        <h2 className={`${PVE_TITLE} mb-2`}>Roster de rivales</h2>
        <AdminSurvivalRosterEditor
          roster={current.roster}
          arenaOpponents={modes.arenaOpponents}
          onChange={(roster) => edit({ roster })}
        />
      </section>

      <section className={PVE_SECTION}>
        <h2 className={`${PVE_TITLE} mb-2`}>Tramos de escalado ({current.stages.length})</h2>
        <AdminSurvivalStageEditor stages={current.stages} onChange={(stages) => edit({ stages })} />
      </section>

      <AdminSurvivalPreview draft={current} arenaOpponents={modes.arenaOpponents} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Publicar nueva versión del ruleset"
          className={PVE_SAVE_BUTTON}
          disabled={modes.isBusy || current.roster.length === 0}
          onClick={() => void modes.publishSurvivalRuleset(current).then((ok) => ok && setDraft(null))}
        >
          Publicar versión
        </button>
        {draft ? (
          <button type="button" aria-label="Descartar cambios del ruleset" className={PVE_GHOST_BUTTON} onClick={() => setDraft(null)}>
            Descartar cambios
          </button>
        ) : null}
        {current.roster.length === 0 ? (
          <span className="text-[10px] text-rose-300">Añade al menos un rival antes de publicar.</span>
        ) : null}
      </div>

      <AdminPveVersionHistory
        title="Historial de rulesets"
        rows={modes.survivalRulesets.map((ruleset) => ({
          version: ruleset.version,
          isActive: ruleset.isActive,
          publishedAtIso: ruleset.publishedAtIso,
          summary: `Tier ${ruleset.startTier} · ${ruleset.roster.length} rivales · hito cada ${ruleset.milestoneInterval} · ${ruleset.stages.length} tramos`,
        }))}
      />
    </div>
  );
}
