// src/components/admin/internal/AdminCardMasteryPassiveSelector.tsx - Selector admin de la pasiva de una entity: V5 (a maestría) o innata (desde V1, escalable).
"use client";

import { useEffect, useState } from "react";
import { IMasteryPassiveOption } from "@/core/repositories/ICardMasteryPassiveAdminRepository";

interface IAdminCardMasteryPassiveSelectorProps {
  cardId: string;
}

type SelectorStatus = "loading" | "idle" | "saving" | "saved" | "error";
type AssignmentMap = Record<string, string>;

const ENDPOINT = "/api/admin/catalog/mastery-passive";

/** Resuelve la pasiva vigente de una carta: la innata manda sobre la de maestría. */
function resolveCurrent(cardId: string, v5: AssignmentMap, innate: AssignmentMap): { passiveId: string; innate: boolean } {
  if (innate[cardId]) return { passiveId: innate[cardId], innate: true };
  if (v5[cardId]) return { passiveId: v5[cardId], innate: false };
  return { passiveId: "", innate: false };
}

export function AdminCardMasteryPassiveSelector({ cardId }: IAdminCardMasteryPassiveSelectorProps) {
  const [options, setOptions] = useState<IMasteryPassiveOption[]>([]);
  const [v5Map, setV5Map] = useState<AssignmentMap>({});
  const [innateMap, setInnateMap] = useState<AssignmentMap>({});
  const [selected, setSelected] = useState("");
  const [isInnate, setIsInnate] = useState(false);
  const [status, setStatus] = useState<SelectorStatus>("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    fetch(ENDPOINT)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load"))))
      .then((data: { passives: IMasteryPassiveOption[]; assignments: AssignmentMap; innateAssignments: AssignmentMap }) => {
        if (!active) return;
        setOptions(data.passives ?? []);
        setV5Map(data.assignments ?? {});
        setInnateMap(data.innateAssignments ?? {});
        setStatus("idle");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  const current = resolveCurrent(cardId, v5Map, innateMap);
  useEffect(() => {
    setSelected(current.passiveId);
    setIsInnate(current.innate);
  }, [current.passiveId, current.innate]);

  const isDirty = selected !== current.passiveId || isInnate !== current.innate;

  async function handleSave() {
    setStatus("saving");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId, passiveSkillId: selected, innate: isInnate }),
      });
      if (!response.ok) throw new Error("save");
      const nextV5: AssignmentMap = { ...v5Map };
      const nextInnate: AssignmentMap = { ...innateMap };
      delete nextV5[cardId];
      delete nextInnate[cardId];
      if (selected !== "") (isInnate ? nextInnate : nextV5)[cardId] = selected;
      setV5Map(nextV5);
      setInnateMap(nextInnate);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      <label htmlFor="admin-mastery-passive" className="block text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
        Pasiva de la carta
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <select
          id="admin-mastery-passive"
          aria-label="Pasiva de la carta"
          className="h-8 min-w-0 flex-1 rounded-md border border-slate-600 bg-slate-950/70 px-2 text-[11px] text-slate-100 outline-none focus:border-fuchsia-400 disabled:opacity-50"
          value={selected}
          disabled={status === "loading" || status === "saving"}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">{status === "loading" ? "Cargando…" : "Sin asignar"}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Guardar pasiva de la carta"
          className="h-8 shrink-0 rounded-md border border-fuchsia-500/70 bg-fuchsia-950/50 px-3 text-[10px] font-black uppercase tracking-wider text-fuchsia-200 transition hover:bg-fuchsia-900/50 disabled:opacity-40"
          onClick={() => void handleSave()}
          disabled={!isDirty || status === "saving"}
        >
          {status === "saving" ? "…" : "Guardar"}
        </button>
      </div>
      <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          aria-label="Pasiva innata desde V1"
          checked={isInnate}
          disabled={status === "loading" || status === "saving" || selected === ""}
          onChange={(event) => setIsInnate(event.target.checked)}
        />
        Innata (activa desde V1, escala hasta V5)
      </label>
      {status === "error" ? <p className="mt-1.5 text-[11px] font-semibold text-rose-300">No se pudo cargar o guardar la pasiva.</p> : null}
      {status === "saved" ? <p className="mt-1.5 text-[11px] font-semibold text-emerald-300">Pasiva actualizada.</p> : null}
    </div>
  );
}
