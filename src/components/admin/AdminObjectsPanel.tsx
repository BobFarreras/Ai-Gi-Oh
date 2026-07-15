// src/components/admin/AdminObjectsPanel.tsx - Panel admin para gestionar los objetos del mercado: caramelos de
// nivel (level_candies) y objetos de mejora ATK/DEF (card_upgrade_items). Permite crear, editar y activar/
// desactivar. El precio/valor que se guarda aquí es la fuente de la verdad que consume el mercado.
"use client";

import { useCallback, useState } from "react";
import {
  IAdminCardUpgradeItemEntry,
  IAdminLevelCandyEntry,
  IAdminShopObjectsSnapshot,
} from "@/core/entities/admin/IAdminShopObjects";
import {
  fetchAdminShopObjects,
  saveAdminCardUpgradeItem,
  saveAdminLevelCandy,
} from "@/components/admin/admin-objects-api";

interface IAdminObjectsPanelProps {
  initialSnapshot: IAdminShopObjectsSnapshot;
}

const FIELD_CLASS =
  "w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-cyan-500";
const LABEL_CLASS = "mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400";
const SAVE_BTN_CLASS =
  "rounded-md border border-cyan-600/60 bg-cyan-950/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 transition-colors hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-50";

function EmptyCandy(): IAdminLevelCandyEntry {
  return { id: "", name: "", levels: 1, priceNexus: 0, imageUrl: null, isActive: true };
}

function EmptyUpgrade(): IAdminCardUpgradeItemEntry {
  return { id: "", name: "", stat: "ATTACK", value: 100, priceNexus: 0, imageUrl: null, isActive: true };
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
        isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-600/20 text-slate-400"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}

function CandyEditor({
  entry,
  isNew,
  onSaved,
}: {
  entry: IAdminLevelCandyEntry;
  isNew: boolean;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<IAdminLevelCandyEntry>(entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await saveAdminLevelCandy(draft);
      onSaved();
      if (isNew) setDraft(EmptyCandy());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }, [draft, isNew, onSaved]);

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold text-slate-200">{isNew ? "Nuevo caramelo" : draft.name || draft.id}</span>
        {!isNew && <StatusPill isActive={draft.isActive} />}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL_CLASS}>ID {isNew ? "(slug)" : ""}</label>
          <input
            className={`${FIELD_CLASS} ${isNew ? "" : "opacity-60"}`}
            value={draft.id}
            disabled={!isNew}
            placeholder="candy-usb-raro-6"
            onChange={(e) => setDraft({ ...draft, id: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL_CLASS}>Nombre</label>
          <input className={FIELD_CLASS} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Niveles (1-5)</label>
          <input
            type="number"
            min={1}
            max={5}
            className={FIELD_CLASS}
            value={draft.levels}
            onChange={(e) => setDraft({ ...draft, levels: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Precio Nexus</label>
          <input
            type="number"
            min={0}
            className={FIELD_CLASS}
            value={draft.priceNexus}
            onChange={(e) => setDraft({ ...draft, priceNexus: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Imagen (URL)</label>
          <input
            className={FIELD_CLASS}
            value={draft.imageUrl ?? ""}
            placeholder="/assets/items/…"
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
          A la venta
        </label>
        <button type="button" className={SAVE_BTN_CLASS} disabled={saving} onClick={save}>
          {saving ? "Guardando…" : isNew ? "Crear" : "Guardar"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

function UpgradeEditor({
  entry,
  isNew,
  onSaved,
}: {
  entry: IAdminCardUpgradeItemEntry;
  isNew: boolean;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<IAdminCardUpgradeItemEntry>(entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await saveAdminCardUpgradeItem(draft);
      onSaved();
      if (isNew) setDraft(EmptyUpgrade());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }, [draft, isNew, onSaved]);

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold text-slate-200">{isNew ? "Nuevo objeto de mejora" : draft.name || draft.id}</span>
        {!isNew && <StatusPill isActive={draft.isActive} />}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={LABEL_CLASS}>ID {isNew ? "(slug)" : ""}</label>
          <input
            className={`${FIELD_CLASS} ${isNew ? "" : "opacity-60"}`}
            value={draft.id}
            disabled={!isNew}
            placeholder="item-nucleo-overclock-2"
            onChange={(e) => setDraft({ ...draft, id: e.target.value })}
          />
        </div>
        <div className="col-span-2 sm:col-span-2">
          <label className={LABEL_CLASS}>Nombre</label>
          <input className={FIELD_CLASS} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Atributo</label>
          <select
            className={FIELD_CLASS}
            value={draft.stat}
            onChange={(e) => setDraft({ ...draft, stat: e.target.value === "DEFENSE" ? "DEFENSE" : "ATTACK" })}
          >
            <option value="ATTACK">ATAQUE</option>
            <option value="DEFENSE">DEFENSA</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Valor (+ATK/DEF)</label>
          <input
            type="number"
            min={1}
            className={FIELD_CLASS}
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Precio Nexus</label>
          <input
            type="number"
            min={0}
            className={FIELD_CLASS}
            value={draft.priceNexus}
            onChange={(e) => setDraft({ ...draft, priceNexus: Number(e.target.value) })}
          />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className={LABEL_CLASS}>Imagen (URL)</label>
          <input
            className={FIELD_CLASS}
            value={draft.imageUrl ?? ""}
            placeholder="/assets/items/…"
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
          A la venta
        </label>
        <button type="button" className={SAVE_BTN_CLASS} disabled={saving} onClick={save}>
          {saving ? "Guardando…" : isNew ? "Crear" : "Guardar"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

export function AdminObjectsPanel({ initialSnapshot }: IAdminObjectsPanelProps) {
  const [snapshot, setSnapshot] = useState<IAdminShopObjectsSnapshot>(initialSnapshot);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setSnapshot(await fetchAdminShopObjects());
      setRefreshError(null);
    } catch (caught) {
      setRefreshError(caught instanceof Error ? caught.message : "No se pudo refrescar la lista.");
    }
  }, []);

  return (
    <div className="home-modern-scroll h-full overflow-y-auto pr-1">
      <header className="mb-3">
        <h1 className="text-sm font-black uppercase tracking-widest text-cyan-200">Objetos del mercado</h1>
        <p className="text-[11px] text-slate-400">
          Caramelos de nivel y objetos de mejora ATK/DEF. Crear, editar precio/valor y activar o desactivar la venta.
        </p>
        {refreshError && <p className="mt-1 text-[11px] text-rose-400">{refreshError}</p>}
      </header>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">Caramelos de nivel (USB Raro)</h2>
        <div className="grid gap-2 lg:grid-cols-2">
          {snapshot.candies.map((candy) => (
            <CandyEditor key={candy.id} entry={candy} isNew={false} onSaved={refresh} />
          ))}
        </div>
        <div className="mt-2">
          <CandyEditor entry={EmptyCandy()} isNew onSaved={refresh} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">Objetos de mejora (ATK/DEF)</h2>
        <div className="grid gap-2 lg:grid-cols-2">
          {snapshot.upgradeItems.map((item) => (
            <UpgradeEditor key={item.id} entry={item} isNew={false} onSaved={refresh} />
          ))}
        </div>
        <div className="mt-2">
          <UpgradeEditor entry={EmptyUpgrade()} isNew onSaved={refresh} />
        </div>
      </section>
    </div>
  );
}
