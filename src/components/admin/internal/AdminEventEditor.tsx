// src/components/admin/internal/AdminEventEditor.tsx - Editor completo de un evento: datos básicos, reglas de puntos (cómo se ganan) y tienda de canje (con cartas reales).
"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminEventRewardKind, IAdminEvent, IAdminEventRule, IAdminEventShopItem, IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";
import { IAdminShopObjectsSnapshot } from "@/core/entities/admin/IAdminShopObjects";
import { ACTION_OBJECTIVE_TYPES, MISSION_OBJECTIVE_TYPES, OBJECTIVE_TYPES_WITH_PARAM, progressionActionLabel } from "@/core/services/progression/action-labels";
import { fetchAdminShopObjects } from "@/components/admin/admin-objects-api";
import { AdminEventChallengeRow } from "./AdminEventChallengeRow";
import { LiveOpsField, LiveOpsNumber, LiveOpsToggle, LiveOpsSaveBar, LiveOpsCardPicker } from "./live-ops/live-ops-controls";
import { saveLiveOps, deleteLiveOps } from "./live-ops/save-live-ops";

const EMPTY_OBJECTS: IAdminShopObjectsSnapshot = { candies: [], upgradeItems: [] };

function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function localInputToIso(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function RuleRow({ eventId, rule, onDelete }: { eventId: string; rule: IAdminEventRule; onDelete: () => void }) {
  const [points, setPoints] = useState(rule.pointsPer);
  return (
    <div className="flex items-center gap-3 border border-cyan-900/40 bg-black/30 px-3 py-2">
      <span className="flex-1 font-mono text-xs text-slate-200">{progressionActionLabel(rule.actionType)}</span>
      <input type="number" min={1} className="w-20 border border-cyan-900/60 bg-[#03101c] px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-400" value={points} onChange={(event) => setPoints(Number(event.target.value))} />
      <span className="font-mono text-[10px] uppercase text-cyan-500/70">pts</span>
      <LiveOpsSaveBar onSave={() => saveLiveOps("eventRule", { eventId, actionType: rule.actionType, pointsPer: points })} label="OK" />
      <button
        type="button"
        aria-label={`Eliminar regla ${progressionActionLabel(rule.actionType)}`}
        onClick={onDelete}
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-rose-700/60 text-rose-300 transition-colors hover:border-rose-500 hover:bg-rose-500/10"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></svg>
      </button>
    </div>
  );
}

/** Deriva el id del item desde su contenido: `${evento}-${carta|objeto}`. Así el id nunca queda desincronizado. */
function deriveShopItemId(eventId: string, ref: string, fallbackId: string): string {
  return ref ? `${eventId}-${ref}` : fallbackId;
}

function ShopItemRow({ item, eventId, objects, wasPersisted }: { item: IAdminEventShopItem; eventId: string; objects: IAdminShopObjectsSnapshot; wasPersisted: boolean }) {
  const [draft, setDraft] = useState<IAdminEventShopItem>(item);
  // Último id realmente persistido (null si el item aún no se ha guardado nunca).
  const [lastSavedId, setLastSavedId] = useState<string | null>(wasPersisted ? item.id : null);

  function update<K extends keyof IAdminEventShopItem>(key: K, value: IAdminEventShopItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  // Al cambiar el tipo de premio se limpia la referencia contraria (carta ↔ objeto).
  function changeRewardKind(kind: AdminEventRewardKind) {
    setDraft((prev) => ({ ...prev, rewardKind: kind, cardId: kind === "CARD" ? prev.cardId : null, objectId: kind === "CARD" ? null : prev.objectId }));
  }

  const isCard = draft.rewardKind === "CARD";
  const objectOptions = draft.rewardKind === "LEVEL_CANDY" ? objects.candies : draft.rewardKind === "CARD_UPGRADE" ? objects.upgradeItems : [];
  const ref = isCard ? (draft.cardId ?? "") : (draft.objectId ?? "");
  const derivedId = deriveShopItemId(eventId, ref, draft.id);

  async function handleSave(): Promise<boolean> {
    if (isCard ? !draft.cardId : !draft.objectId) return false; // sin referencia no hay item válido que tarifar
    const ok = await saveLiveOps("eventShopItem", { ...draft, id: derivedId });
    if (!ok) return false;
    // Si la referencia cambió, el id cambia: borra la fila anterior para no dejar huérfanos.
    if (lastSavedId && lastSavedId !== derivedId) await deleteLiveOps("eventShopItem", lastSavedId);
    setLastSavedId(derivedId);
    return true;
  }

  return (
    <div className="flex gap-3 border border-fuchsia-900/40 bg-[#0a0716]/70 p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-fuchsia-500/70">Premio</span>
          <select
            aria-label="Tipo de premio del item"
            className="w-full border border-fuchsia-900/60 bg-[#0a0716] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-fuchsia-400"
            value={draft.rewardKind}
            onChange={(event) => changeRewardKind(event.target.value as AdminEventRewardKind)}
          >
            <option value="CARD">Carta</option>
            <option value="LEVEL_CANDY">Caramelo de nivel</option>
            <option value="CARD_UPGRADE">Objeto de mejora</option>
          </select>
        </label>
        {isCard ? (
          <LiveOpsCardPicker cardId={draft.cardId ?? ""} onChange={(value) => update("cardId", value)} />
        ) : (
          <select
            aria-label="Objeto del item"
            className="w-full border border-fuchsia-900/60 bg-[#0a0716] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-fuchsia-400"
            value={draft.objectId ?? ""}
            onChange={(event) => update("objectId", event.target.value || null)}
          >
            <option value="">— Elige un objeto —</option>
            {objectOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}{option.isActive ? "" : " (inactivo)"}</option>
            ))}
          </select>
        )}
        <div className="grid grid-cols-2 gap-2">
          <LiveOpsNumber label="Coste (pts)" value={draft.costPoints} min={1} onChange={(value) => update("costPoints", value)} />
          <LiveOpsNumber label="Límite/jugador" value={draft.perPlayerLimit} min={1} onChange={(value) => update("perPlayerLimit", value)} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <LiveOpsToggle label="Item" checked={draft.isActive} onChange={(value) => update("isActive", value)} />
          <LiveOpsSaveBar onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}

type EventDraft = Omit<IAdminEvent, "rules" | "items" | "missions">;

export function AdminEventEditor({ event }: { event: IAdminEvent }) {
  const [draft, setDraft] = useState<EventDraft>(event);
  const [rules, setRules] = useState<IAdminEventRule[]>(event.rules ?? []);
  const [items, setItems] = useState<IAdminEventShopItem[]>(event.items ?? []);
  const [missions, setMissions] = useState<IAdminMissionDefinition[]>(event.missions ?? []);
  const [objects, setObjects] = useState<IAdminShopObjectsSnapshot>(EMPTY_OBJECTS);
  const [newAction, setNewAction] = useState("");
  const [newMissionObjective, setNewMissionObjective] = useState("");

  // Catálogo de objetos del mercado para el picker de items tipo objeto (Fase 2). Fallo → picker vacío.
  useEffect(() => {
    let active = true;
    fetchAdminShopObjects()
      .then((snapshot) => { if (active) setObjects(snapshot); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  function update<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  // Solo acciones repetibles (incluidas las flawless): los objetivos de colección no se otorgan
  // por acción ni admiten umbral aquí; ésos se configuran como "Misiones del evento".
  const availableActions = ACTION_OBJECTIVE_TYPES.filter((action) => !rules.some((rule) => rule.actionType === action));

  function addRule() {
    if (!newAction) return;
    setRules((prev) => [...prev, { eventId: draft.id, actionType: newAction, pointsPer: 10 }]);
    setNewAction("");
  }
  async function deleteRule(actionType: string) {
    await deleteLiveOps("eventRule", { eventId: draft.id, actionType });
    setRules((prev) => prev.filter((rule) => rule.actionType !== actionType));
  }
  // ids que ya existían en la BD al cargar: sirven para que ShopItemRow sepa si debe limpiar
  // la fila anterior cuando se cambia la carta (y por tanto el id derivado).
  const initialItemIds = useMemo(() => new Set((event.items ?? []).map((item) => item.id)), [event.items]);

  function addItem() {
    // id temporal hasta que se elija contenido; al guardar, ShopItemRow lo sustituye por `${evento}-${ref}`.
    const id = `${draft.id}-nuevo-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { id, eventId: draft.id, rewardKind: "CARD", cardId: "", objectId: null, costPoints: 100, perPlayerLimit: 1, sortOrder: prev.length + 1, isActive: true }]);
  }
  function addMission(objectiveType: string) {
    if (!objectiveType) return;
    const id = `${draft.id}-mission-${Math.random().toString(36).slice(2, 7)}`;
    setMissions((prev) => [
      ...prev,
      {
        id, scope: "EVENT", objectiveType,
        objectiveParam: OBJECTIVE_TYPES_WITH_PARAM.has(objectiveType) ? 1 : null, targetCount: 1,
        rewardNexus: 50, rewardType: "EVENT_POINTS", eventId: draft.id,
        // Activo por defecto: igual que las reglas por acción, así el jugador lo ve en cuanto se guarda.
        title: `Nuevo reto: ${progressionActionLabel(objectiveType)}`, description: null, sortOrder: prev.length + 1, isActive: true,
      },
    ]);
    setNewMissionObjective("");
  }
  async function deleteMission(id: string) {
    await deleteLiveOps("mission", id);
    setMissions((prev) => prev.filter((mission) => mission.id !== id));
  }

  return (
    <div className="border border-fuchsia-800/40 bg-[#060a16]/80 p-4" style={{ clipPath: "polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)" }}>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-mono text-base font-black uppercase tracking-[0.14em] text-fuchsia-200">{draft.name}</h3>
        <span className="ml-auto font-mono text-[10px] text-slate-600">{draft.id}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LiveOpsField label="Nombre" value={draft.name} onChange={(value) => update("name", value)} />
        <LiveOpsField label="Moneda" value={draft.currencyName} onChange={(value) => update("currencyName", value)} />
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">Empieza</span>
          <input type="datetime-local" className="w-full border border-cyan-900/60 bg-[#03101c] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400" value={isoToLocalInput(draft.startsAt)} onChange={(event) => update("startsAt", localInputToIso(event.target.value))} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">Termina</span>
          <input type="datetime-local" className="w-full border border-cyan-900/60 bg-[#03101c] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400" value={isoToLocalInput(draft.endsAt)} onChange={(event) => update("endsAt", localInputToIso(event.target.value))} />
        </label>
        <div className="sm:col-span-2"><LiveOpsField label="Descripción" value={draft.description ?? ""} onChange={(value) => update("description", value)} /></div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <LiveOpsToggle label="Evento" checked={draft.isActive} onChange={(value) => update("isActive", value)} />
        <LiveOpsSaveBar onSave={() => saveLiveOps("event", draft)} label="Guardar evento" />
      </div>

      <div className="mt-5">
        <h4 className="mb-3 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400/80">Cómo se ganan {draft.currencyName}</h4>

        <h5 className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-500/70">Por cada acción (cada vez)</h5>
        <p className="mb-2 text-[11px] leading-snug text-slate-500">+X {draft.currencyName} cada vez que el jugador realiza la acción.</p>
        <div className="space-y-2">
          {rules.map((rule) => <RuleRow key={rule.actionType} eventId={draft.id} rule={rule} onDelete={() => deleteRule(rule.actionType)} />)}
        </div>
        {availableActions.length > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <select aria-label="Acción de la nueva regla de puntos" className="flex-1 border border-cyan-900/60 bg-[#03101c] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400" value={newAction} onChange={(event) => setNewAction(event.target.value)}>
              <option value="">+ Añadir acción…</option>
              {availableActions.map((action) => <option key={action} value={action}>{progressionActionLabel(action)}</option>)}
            </select>
            <button type="button" onClick={addRule} className="h-9 border border-cyan-500/60 px-3 font-mono text-xs font-bold uppercase text-cyan-200 hover:bg-cyan-500/10">Añadir</button>
          </div>
        ) : null}

        <h5 className="mb-1 mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-500/70">Retos (una vez)</h5>
        <p className="mb-2 text-[11px] leading-snug text-slate-500">Se completan una vez durante el evento. Ej.: tener N cartas a un nivel/versión, o ganar sin perder LP. El jugador los ve en el diálogo del evento.</p>
        {missions.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500">Sin retos todavía. Elige un objetivo abajo para crear uno.</p>
        ) : (
          <div className="space-y-2.5">
            {missions.map((mission) => (
              <AdminEventChallengeRow key={mission.id} mission={mission} currencyName={draft.currencyName} onDelete={() => deleteMission(mission.id)} />
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center gap-2">
          <select
            aria-label="Objetivo del nuevo reto"
            className="flex-1 border border-cyan-900/60 bg-[#03101c] px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
            value={newMissionObjective}
            onChange={(event) => setNewMissionObjective(event.target.value)}
          >
            <option value="">+ Elige un reto…</option>
            {MISSION_OBJECTIVE_TYPES.map((type) => <option key={type} value={type}>{progressionActionLabel(type)}</option>)}
          </select>
          <button type="button" onClick={() => addMission(newMissionObjective)} className="h-9 border border-cyan-500/60 px-3 font-mono text-xs font-bold uppercase text-cyan-200 hover:bg-cyan-500/10">Añadir reto</button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-400/80">Tienda de canje</h4>
          <button type="button" onClick={addItem} className="h-8 border border-fuchsia-500/60 px-3 font-mono text-[11px] font-bold uppercase text-fuchsia-200 hover:bg-fuchsia-500/10">+ Añadir item</button>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {items.map((item) => <ShopItemRow key={item.id} item={item} eventId={draft.id} objects={objects} wasPersisted={initialItemIds.has(item.id)} />)}
        </div>
      </div>
    </div>
  );
}
