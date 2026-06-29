// src/components/admin/internal/AdminCardMasteryPassiveSelector.tsx - Selector admin de la pasiva mastery V5 de una entity (desplegable con las pasivas activas).
"use client";

import { useEffect, useState } from "react";
import { IMasteryPassiveOption } from "@/core/repositories/ICardMasteryPassiveAdminRepository";

interface IAdminCardMasteryPassiveSelectorProps {
  cardId: string;
}

type SelectorStatus = "loading" | "idle" | "saving" | "saved" | "error";

const ENDPOINT = "/api/admin/catalog/mastery-passive";

/** Carga las pasivas activas y la asignación actual, y permite cambiar la pasiva V5 de la entity. */
export function AdminCardMasteryPassiveSelector({ cardId }: IAdminCardMasteryPassiveSelectorProps) {
  const [options, setOptions] = useState<IMasteryPassiveOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState<SelectorStatus>("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    fetch(ENDPOINT)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load"))))
      .then((data: { passives: IMasteryPassiveOption[]; assignments: Record<string, string> }) => {
        if (!active) return;
        setOptions(data.passives ?? []);
        setAssignments(data.assignments ?? {});
        setStatus("idle");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelected(assignments[cardId] ?? "");
  }, [cardId, assignments]);

  const isDirty = selected !== "" && selected !== (assignments[cardId] ?? "");

  async function handleSave() {
    setStatus("saving");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId, passiveSkillId: selected }),
      });
      if (!response.ok) throw new Error("save");
      setAssignments((prev) => ({ ...prev, [cardId]: selected }));
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-3 border-t border-slate-700/50 pt-3">
      <label htmlFor="admin-mastery-passive" className="block text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
        Pasiva V5 (al llegar a Maestría)
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <select
          id="admin-mastery-passive"
          aria-label="Pasiva V5 de la carta"
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
          aria-label="Guardar pasiva V5 de la carta"
          className="h-8 shrink-0 rounded-md border border-fuchsia-500/70 bg-fuchsia-950/50 px-3 text-[10px] font-black uppercase tracking-wider text-fuchsia-200 transition hover:bg-fuchsia-900/50 disabled:opacity-40"
          onClick={() => void handleSave()}
          disabled={!isDirty || status === "saving"}
        >
          {status === "saving" ? "…" : "Guardar"}
        </button>
      </div>
      {status === "error" ? <p className="mt-1.5 text-[11px] font-semibold text-rose-300">No se pudo cargar o guardar la pasiva.</p> : null}
      {status === "saved" ? <p className="mt-1.5 text-[11px] font-semibold text-emerald-300">Pasiva V5 actualizada.</p> : null}
    </div>
  );
}
