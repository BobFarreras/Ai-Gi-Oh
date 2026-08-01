// src/components/admin/internal/pve/AdminSurvivalRulesetPanel.tsx - Publica versiones del ruleset de Supervivencia (roster, hitos y escalado).
"use client";

import { useState } from "react";
import { IAdminSurvivalRuleset, IAdminSurvivalStage } from "@/core/entities/admin/IAdminPveModes";
import { SURVIVAL_AI_PROFILES } from "@/core/entities/admin/IAdminPveModes.types";
import { AdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";
import { AdminPveVersionHistory } from "@/components/admin/internal/pve/AdminPveVersionHistory";
import {
  PVE_DANGER_BUTTON, PVE_FIELD, PVE_GHOST_BUTTON, PVE_LABEL, PVE_SAVE_BUTTON, PVE_SECTION, PVE_TITLE,
} from "@/components/admin/internal/pve/admin-pve-styles";

const NEW_STAGE: IAdminSurvivalStage = {
  fromBattle: 1, aiProfile: "HARD", maxTier: 8, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "survival-base",
};

type Draft = Pick<IAdminSurvivalRuleset, "startTier" | "battlesPerTier" | "roster" | "milestoneInterval" | "milestoneHeal" | "stages">;

function toDraft(active: IAdminSurvivalRuleset | undefined): Draft {
  if (!active) return { startTier: 4, battlesPerTier: 2, roster: [], milestoneInterval: 5, milestoneHeal: 2000, stages: [NEW_STAGE] };
  const { startTier, battlesPerTier, roster, milestoneInterval, milestoneHeal, stages } = active;
  return { startTier, battlesPerTier, roster: [...roster], milestoneInterval, milestoneHeal, stages: stages.map((stage) => ({ ...stage })) };
}

export function AdminSurvivalRulesetPanel({ modes }: { modes: AdminPveModes }) {
  const active = modes.survivalRulesets.find((ruleset) => ruleset.isActive);
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = draft ?? toDraft(active);
  const edit = (patch: Partial<Draft>) => setDraft({ ...current, ...patch });
  const editStage = (index: number, patch: Partial<IAdminSurvivalStage>) =>
    edit({ stages: current.stages.map((stage, position) => (position === index ? { ...stage, ...patch } : stage)) });

  return (
    <div className="home-modern-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <section className={PVE_SECTION}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className={PVE_TITLE}>Expedición · versión activa v{active?.version ?? "—"}</h2>
          <p className="text-[10px] text-slate-500">Guardar publica una versión nueva. Las expediciones en curso conservan la suya.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className={PVE_LABEL}>Tier inicial
            <input aria-label="Tier inicial" className={`${PVE_FIELD} w-14`} inputMode="numeric" value={current.startTier}
              onChange={(event) => edit({ startTier: Number(event.target.value) || 1 })} />
          </label>
          <label className={PVE_LABEL}>Combates por tier
            <input aria-label="Combates por tier" className={`${PVE_FIELD} w-14`} inputMode="numeric" value={current.battlesPerTier}
              onChange={(event) => edit({ battlesPerTier: Number(event.target.value) || 1 })} />
          </label>
          <label className={PVE_LABEL}>Hito cada
            <input aria-label="Intervalo de hito" className={`${PVE_FIELD} w-14`} inputMode="numeric" value={current.milestoneInterval}
              onChange={(event) => edit({ milestoneInterval: Number(event.target.value) || 1 })} />
          </label>
          <label className={PVE_LABEL}>Curación de hito
            <input aria-label="Curación de hito" className={`${PVE_FIELD} w-20`} inputMode="numeric" value={current.milestoneHeal}
              onChange={(event) => edit({ milestoneHeal: Number(event.target.value) || 0 })} />
          </label>
        </div>
        <label className="mt-2 block text-[10px] text-slate-400">
          Roster (ids de rivales de Arena, uno por línea y en orden)
          <textarea
            aria-label="Roster de la expedición"
            rows={4}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-950/70 p-2 font-mono text-[11px] text-slate-100 focus:border-cyan-600 focus:outline-none"
            value={current.roster.join("\n")}
            onChange={(event) => edit({ roster: event.target.value.split("\n").map((id) => id.trim()).filter(Boolean) })}
          />
        </label>
      </section>

      <section className={PVE_SECTION}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className={PVE_TITLE}>Tramos de escalado ({current.stages.length})</h2>
          <button type="button" aria-label="Añadir tramo de escalado" className={PVE_GHOST_BUTTON} disabled={modes.isBusy}
            onClick={() => edit({ stages: [...current.stages, { ...NEW_STAGE, fromBattle: current.stages.length + 1 }] })}>
            + Tramo
          </button>
        </div>
        <div className="space-y-1.5">
          {current.stages.map((stage, index) => (
            <div key={`stage-${index}`} className="flex flex-wrap items-center gap-1.5 rounded border border-slate-800/70 bg-slate-950/50 p-1.5">
              <label className={PVE_LABEL}>Desde
                <input aria-label={`Combate inicial del tramo ${index + 1}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={stage.fromBattle}
                  onChange={(event) => editStage(index, { fromBattle: Number(event.target.value) || 1 })} />
              </label>
              <select aria-label={`Perfil de IA del tramo ${index + 1}`} className={`${PVE_FIELD} w-24`} value={stage.aiProfile}
                onChange={(event) => editStage(index, { aiProfile: event.target.value as IAdminSurvivalStage["aiProfile"] })}>
                {SURVIVAL_AI_PROFILES.map((profile) => <option key={profile} value={profile}>{profile}</option>)}
              </select>
              <label className={PVE_LABEL}>Tier máx
                <input aria-label={`Tier máximo del tramo ${index + 1}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={stage.maxTier}
                  onChange={(event) => editStage(index, { maxTier: Number(event.target.value) || 1 })} />
              </label>
              <label className={PVE_LABEL} title="LP extra del rival por vuelta de Ascensión">LP rival
                <input aria-label={`Bonus de LP del tramo ${index + 1}`} className={`${PVE_FIELD} w-16`} inputMode="numeric" value={stage.maxLpBonus}
                  onChange={(event) => editStage(index, { maxLpBonus: Number(event.target.value) || 0 })} />
              </label>
              <label className={PVE_LABEL} title="ATK/DEF extra por vuelta de Ascensión">Stats/vuelta
                <input aria-label={`Bonus de stats del tramo ${index + 1}`} className={`${PVE_FIELD} w-16`} inputMode="numeric" value={stage.statBonusPerRank}
                  onChange={(event) => editStage(index, { statBonusPerRank: Number(event.target.value) || 0 })} />
              </label>
              <input aria-label={`Recompensa del tramo ${index + 1}`} className={`${PVE_FIELD} min-w-0 flex-1`} placeholder="reward-id" value={stage.rewardDefinitionId}
                onChange={(event) => editStage(index, { rewardDefinitionId: event.target.value })} />
              <button type="button" aria-label={`Quitar tramo ${index + 1}`} className={PVE_DANGER_BUTTON} disabled={current.stages.length <= 1}
                onClick={() => edit({ stages: current.stages.filter((_, position) => position !== index) })}>×</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" aria-label="Publicar nueva versión del ruleset" className={PVE_SAVE_BUTTON} disabled={modes.isBusy}
            onClick={() => void modes.publishSurvivalRuleset(current).then((ok) => ok && setDraft(null))}>
            Publicar versión
          </button>
          {draft ? (
            <button type="button" aria-label="Descartar cambios del ruleset" className={PVE_GHOST_BUTTON} onClick={() => setDraft(null)}>Descartar</button>
          ) : null}
        </div>
      </section>

      <AdminPveVersionHistory
        title="Historial de rulesets"
        rows={modes.survivalRulesets.map((ruleset) => ({
          version: ruleset.version,
          isActive: ruleset.isActive,
          publishedAtIso: ruleset.publishedAtIso,
          summary: `Tier ${ruleset.startTier} · hito cada ${ruleset.milestoneInterval} · ${ruleset.stages.length} tramos`,
        }))}
      />
    </div>
  );
}
