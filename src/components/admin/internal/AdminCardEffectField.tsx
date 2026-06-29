// src/components/admin/internal/AdminCardEffectField.tsx - Editor del efecto de carta: selector de acción + interpretación legible + JSON avanzado.
"use client";

import { useMemo } from "react";
import { describeEffectJson, getEffectActionOptions } from "@/core/services/effects/effect-catalog";
import { EffectCategory } from "@/core/services/effects/effect-catalog-types";

interface IAdminCardEffectFieldProps {
  effectJson: string;
  isBusy: boolean;
  onChange: (effectJson: string) => void;
}

const GROUP_LABELS: Partial<Record<EffectCategory, string>> = {
  EXECUTION: "Ejecuciones (Magia)",
  TRAP: "Trampas",
  ENTITY: "Innatos de Entity",
};

/** Sección del formulario de carta para definir su efecto de forma entendible. */
export function AdminCardEffectField({ effectJson, isBusy, onChange }: IAdminCardEffectFieldProps) {
  const options = useMemo(() => getEffectActionOptions(), []);
  const described = describeEffectJson(effectJson);
  const hasUnknownEffect = effectJson.trim() !== "" && described === null;

  function applyAction(actionKey: string) {
    if (actionKey === "") return onChange("");
    const option = options.find((item) => item.key === actionKey);
    if (option?.exampleJson) onChange(option.exampleJson);
  }

  return (
    <section className="space-y-2 rounded-lg border border-slate-700/80 bg-slate-950/40 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-200">Efecto de la carta</p>

      <label className="block text-[11px] text-slate-300">
        Acción (elige una y se rellena el JSON)
        <select
          aria-label="Acción del efecto"
          className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100"
          value={described?.key ?? ""}
          disabled={isBusy}
          onChange={(event) => applyAction(event.target.value)}
        >
          <option value="">Sin efecto</option>
          {Object.entries(GROUP_LABELS).map(([category, label]) => (
            <optgroup key={category} label={label}>
              {options
                .filter((item) => item.category === category)
                .map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      {described ? (
        <div className="rounded-md border border-emerald-700/50 bg-emerald-950/30 p-2">
          <p className="text-[11px] font-bold text-emerald-200">{described.name}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-100/80">{described.description}</p>
        </div>
      ) : null}
      {hasUnknownEffect ? <p className="text-[11px] font-semibold text-amber-300">Acción no reconocida o JSON inválido. Revisa el formato.</p> : null}

      <label className="block text-[11px] text-slate-400">
        JSON del efecto (avanzado: ajusta valores como value, target o archetype)
        <textarea
          aria-label="JSON de efecto"
          className="mt-1 min-h-24 w-full rounded-md border border-slate-600 bg-slate-900 p-2 font-mono text-xs text-slate-100"
          value={effectJson}
          onChange={(event) => onChange(event.target.value)}
          placeholder='{"action":"DAMAGE","target":"OPPONENT","value":300}'
          disabled={isBusy}
        />
      </label>
    </section>
  );
}
