// src/components/admin/internal/arena/AdminArenaCardDialog.tsx - Diálogo modal para editar una carta del mazo de
// arena (carta, versión, nivel, xp) y EQUIPAR objetos del catálogo (suman su valor al bonus ATK/DEF de la carta).
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ICard } from "@/core/entities/ICard";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { IAdminCardUpgradeItemEntry } from "@/core/entities/admin/IAdminShopObjects";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { fetchAdminShopObjects } from "@/components/admin/admin-objects-api";

interface IAdminArenaCardDialogProps {
  entry: IAdminArenaCardEntry;
  validCards: ICard[];
  onChange: (patch: Partial<IAdminArenaCardEntry>) => void;
  onRemove: () => void;
  onClose: () => void;
}

function parseOverride(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const FIELD = "mt-0.5 h-8 w-full rounded border border-slate-600 bg-slate-950/70 px-2 text-xs text-slate-100";

export function AdminArenaCardDialog({ entry, validCards, onChange, onRemove, onClose }: IAdminArenaCardDialogProps) {
  const [upgradeItems, setUpgradeItems] = useState<IAdminCardUpgradeItemEntry[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string>("");

  // Catálogo de objetos de mejora para equipar (Fase 1). Fallo → picker vacío (edición manual sigue disponible).
  useEffect(() => {
    let active = true;
    fetchAdminShopObjects()
      .then((snapshot) => { if (active) setUpgradeItems(snapshot.upgradeItems); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (typeof document === "undefined") return null;
  const resolved = validCards.find((card) => card.id === entry.cardId);
  const sortedOptions = [...validCards].sort((a, b) => a.name.localeCompare(b.name));
  const attackBonus = entry.attackBonus ?? 0;
  const defenseBonus = entry.defenseBonus ?? 0;

  function equipSelectedObject() {
    const object = upgradeItems.find((item) => item.id === selectedObjectId);
    if (!object) return;
    // Equipar = sumar el valor del objeto al stat correspondiente (apilable).
    if (object.stat === "ATTACK") onChange({ attackBonus: attackBonus + object.value });
    else onChange({ defenseBonus: defenseBonus + object.value });
  }

  return createPortal(
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-cyan-700/50 bg-[#040d1a] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex gap-3">
          <div className="aspect-[13/19] w-24 shrink-0">
            {resolved ? <CardThumbnail card={resolved} versionTier={entry.versionTier ?? 0} level={entry.level ?? undefined} xp={entry.xp ?? 0} /> : <div className="h-full w-full rounded border border-dashed border-slate-700" />}
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400">Carta
              <select aria-label="Carta" className={FIELD} value={entry.cardId} onChange={(event) => onChange({ cardId: event.target.value })}>
                {sortedOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">Versión
                <input aria-label="Versión" className={FIELD} placeholder="auto" inputMode="numeric" value={entry.versionTier ?? ""} onChange={(event) => onChange({ versionTier: parseOverride(event.target.value) })} />
              </label>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">Nivel
                <input aria-label="Nivel" className={FIELD} placeholder="auto" inputMode="numeric" value={entry.level ?? ""} onChange={(event) => onChange({ level: parseOverride(event.target.value) })} />
              </label>
              <label className="block text-[10px] uppercase tracking-wider text-slate-400">XP
                <input aria-label="XP" className={FIELD} placeholder="auto" inputMode="numeric" value={entry.xp ?? ""} onChange={(event) => onChange({ xp: parseOverride(event.target.value) })} />
              </label>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">Vacío = usa el nivel/versión del tier.</p>
          </div>
        </div>

        {/* Objetos equipados: elige un objeto del catálogo y suma su valor al bonus de la carta (apilable). */}
        <div className="mt-3 rounded-lg border border-fuchsia-800/40 bg-[#0a0716]/60 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">Objetos equipados</p>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">+{attackBonus} ATK</span>
              <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300">+{defenseBonus} DEF</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Objeto a equipar"
              className="h-8 min-w-0 flex-1 rounded border border-fuchsia-900/60 bg-[#0a0716] px-2 text-xs text-slate-100"
              value={selectedObjectId}
              onChange={(event) => setSelectedObjectId(event.target.value)}
            >
              <option value="">— Elige un objeto —</option>
              {upgradeItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name} (+{item.value} {item.stat === "ATTACK" ? "ATK" : "DEF"})</option>
              ))}
            </select>
            <button type="button" aria-label="Equipar objeto seleccionado" disabled={!selectedObjectId} className="h-8 shrink-0 rounded border border-fuchsia-600/60 bg-fuchsia-950/40 px-3 text-[11px] font-black uppercase text-fuchsia-200 hover:bg-fuchsia-900/50 disabled:opacity-40" onClick={equipSelectedObject}>Equipar</button>
          </div>
          {(attackBonus > 0 || defenseBonus > 0) ? (
            <button type="button" className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-500 underline hover:text-slate-300" onClick={() => onChange({ attackBonus: 0, defenseBonus: 0 })}>Quitar objetos</button>
          ) : null}
        </div>

        <div className="mt-3 flex justify-between gap-2">
          <button type="button" aria-label="Quitar carta del mazo" className="h-8 rounded border border-rose-700/50 px-3 text-[11px] font-bold uppercase text-rose-300 hover:bg-rose-900/40" onClick={onRemove}>Quitar</button>
          <button type="button" aria-label="Cerrar edición de carta" className="h-8 rounded border border-cyan-600/60 bg-cyan-950/40 px-4 text-[11px] font-black uppercase text-cyan-200 hover:bg-cyan-900/50" onClick={onClose}>Hecho</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
