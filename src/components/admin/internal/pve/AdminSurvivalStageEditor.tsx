// src/components/admin/internal/pve/AdminSurvivalStageEditor.tsx - Tramos de escalado con su rango real y la dificultad como botones.
"use client";

import { IAdminSurvivalStage } from "@/core/entities/admin/IAdminPveModes";
import { SURVIVAL_AI_PROFILES } from "@/core/entities/admin/IAdminPveModes.types";
import { resolveStageRanges } from "@/components/admin/internal/pve/admin-survival-preview";
import { PVE_DANGER_BUTTON, PVE_FIELD, PVE_GHOST_BUTTON } from "@/components/admin/internal/pve/admin-pve-styles";

interface IAdminSurvivalStageEditorProps {
  stages: IAdminSurvivalStage[];
  onChange: (stages: IAdminSurvivalStage[]) => void;
}

const PROFILE_HINT: Record<IAdminSurvivalStage["aiProfile"], string> = {
  HARD: "IA competente; el rival castiga errores claros.",
  BOSS: "IA agresiva con lectura de tablero.",
  MASTER: "IA que planifica fusiones y trampas.",
  MYTHIC: "IA máxima; pensada para las vueltas de Ascensión.",
};

const NEW_STAGE = (fromBattle: number): IAdminSurvivalStage => ({
  fromBattle, aiProfile: "BOSS", maxTier: 8, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "survival-stage",
});

export function AdminSurvivalStageEditor({ stages, onChange }: IAdminSurvivalStageEditorProps) {
  const ranges = resolveStageRanges(stages);
  const editStage = (index: number, patch: Partial<IAdminSurvivalStage>) =>
    onChange(stages.map((stage, position) => (position === index ? { ...stage, ...patch } : stage)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-500">Cada tramo manda desde su combate hasta que empieza el siguiente.</p>
        <button
          type="button"
          aria-label="Añadir tramo de escalado"
          className={PVE_GHOST_BUTTON}
          onClick={() => onChange([...stages, NEW_STAGE(Math.max(...stages.map((stage) => stage.fromBattle), 0) + 5)])}
        >
          + Tramo
        </button>
      </div>

      {stages.map((stage, index) => {
        const range = ranges[index];
        return (
          <div key={`stage-${index}`} className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-amber-700/50 bg-amber-950/30 px-2 py-1 text-[10px] font-black text-amber-200">
                Combates {range.fromBattle}{range.untilBattle === null ? " en adelante" : `–${range.untilBattle}`}
              </span>
              <label className="flex items-center gap-1 text-[10px] text-slate-400">
                Empieza en el combate
                <input
                  aria-label={`Combate inicial del tramo ${index + 1}`}
                  className={`${PVE_FIELD} w-14`}
                  inputMode="numeric"
                  value={stage.fromBattle}
                  onChange={(event) => editStage(index, { fromBattle: Number(event.target.value) || 1 })}
                />
              </label>
              {stages.length > 1 ? (
                <button type="button" aria-label={`Quitar tramo ${index + 1}`} className={`${PVE_DANGER_BUTTON} ml-auto`}
                  onClick={() => onChange(stages.filter((_, position) => position !== index))}>× Quitar</button>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Dificultad de la IA:</span>
              {SURVIVAL_AI_PROFILES.map((profile) => (
                <button
                  key={profile}
                  type="button"
                  aria-label={`Usar dificultad ${profile} en el tramo ${index + 1}`}
                  aria-pressed={stage.aiProfile === profile}
                  title={PROFILE_HINT[profile]}
                  className={`h-7 rounded-md border px-2.5 text-[10px] font-bold uppercase tracking-wider transition ${
                    stage.aiProfile === profile
                      ? "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-200"
                      : "border-slate-700/60 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                  }`}
                  onClick={() => editStage(index, { aiProfile: profile })}
                >
                  {profile}
                </button>
              ))}
              <span className="text-[9.5px] text-slate-500">{PROFILE_HINT[stage.aiProfile]}</span>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-[10px] text-slate-400">
                Tier máximo del rival
                <input aria-label={`Tier máximo del tramo ${index + 1}`} className={`${PVE_FIELD} mt-1 w-full`} inputMode="numeric" value={stage.maxTier}
                  onChange={(event) => editStage(index, { maxTier: Number(event.target.value) || 1 })} />
                <span className="mt-0.5 block text-[9px] text-slate-500">Al llegar aquí el tier deja de subir y empieza la Ascensión.</span>
              </label>
              <label className="text-[10px] text-slate-400">
                LP extra por vuelta
                <input aria-label={`Bonus de LP del tramo ${index + 1}`} className={`${PVE_FIELD} mt-1 w-full`} inputMode="numeric" value={stage.maxLpBonus}
                  onChange={(event) => editStage(index, { maxLpBonus: Number(event.target.value) || 0 })} />
                <span className="mt-0.5 block text-[9px] text-slate-500">LP que gana el rival por cada vuelta completa.</span>
              </label>
              <label className="text-[10px] text-slate-400">
                ATK/DEF extra por vuelta
                <input aria-label={`Bonus de stats del tramo ${index + 1}`} className={`${PVE_FIELD} mt-1 w-full`} inputMode="numeric" value={stage.statBonusPerRank}
                  onChange={(event) => editStage(index, { statBonusPerRank: Number(event.target.value) || 0 })} />
                <span className="mt-0.5 block text-[9px] text-slate-500">Sube sus criaturas cuando nivel y versión ya están al tope.</span>
              </label>
              <label className="text-[10px] text-slate-400">
                Id de recompensa
                <input aria-label={`Recompensa del tramo ${index + 1}`} className={`${PVE_FIELD} mt-1 w-full`} value={stage.rewardDefinitionId}
                  onChange={(event) => editStage(index, { rewardDefinitionId: event.target.value })} />
                <span className="mt-0.5 block text-[9px] text-slate-500">Etiqueta de auditoría del pago de Éter.</span>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
