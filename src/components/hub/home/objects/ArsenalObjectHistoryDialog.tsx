// src/components/hub/home/objects/ArsenalObjectHistoryDialog.tsx - Historial de objetos aplicados (rastro
// visible de la ficha 9b): qué objeto se usó, sobre qué carta y cuándo. Se abre desde el botón junto al
// conmutador Cartas/Objetos y carga el log del servidor al abrirse.
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { History, Package, Shield, Swords } from "lucide-react";
import type { IPlayerUpgradeHistoryEntry } from "@/services/progression/get-player-card-upgrade-history";

interface IArsenalObjectHistoryDialogProps {
  isOpen: boolean;
  /** Nombre de carta por id (del catálogo base del arsenal), para pintar el destino de cada aplicación. */
  cardNameById: Map<string, string>;
  onClose: () => void;
}

/** Texto del efecto de una línea del historial: "+100 ATK", "+100 DEF" o "Nivel 5" (caramelos). */
export function formatUpgradeHistoryEffect(entry: Pick<IPlayerUpgradeHistoryEntry, "itemType" | "stat" | "value">): string {
  if (entry.itemType === "LEVEL_CANDY") return `Nivel ${entry.value}`;
  return `+${entry.value} ${entry.stat === "DEFENSE" ? "DEF" : "ATK"}`;
}

/** Fecha corta en es-ES para una línea del historial. */
export function formatUpgradeHistoryDate(appliedAtIso: string): string {
  const date = new Date(appliedAtIso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function HistoryEntryRow({ entry, cardName }: { entry: IPlayerUpgradeHistoryEntry; cardName: string }) {
  const isCandy = entry.itemType === "LEVEL_CANDY";
  const StatIcon = isCandy ? Package : entry.stat === "DEFENSE" ? Shield : Swords;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-amber-400/25 bg-[#0a0703]/70 p-2.5">
      <div className="relative h-11 w-11 shrink-0">
        {entry.itemImageUrl ? (
          <Image src={entry.itemImageUrl} alt="" fill sizes="44px" className="object-contain" />
        ) : (
          <Package className="h-full w-full text-amber-400/60" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-xs font-black uppercase tracking-wide text-amber-100">{entry.itemName}</p>
        <p className="truncate font-mono text-[10px] uppercase tracking-widest text-slate-400">→ {cardName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="flex items-center justify-end gap-1 font-mono text-[11px] font-black uppercase tracking-widest text-amber-300">
          <StatIcon className="h-3.5 w-3.5" aria-hidden />
          {formatUpgradeHistoryEffect(entry)}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{formatUpgradeHistoryDate(entry.appliedAtIso)}</p>
      </div>
    </li>
  );
}

/** Cuerpo del diálogo. Se monta al ABRIR (el padre no lo pinta cerrado): cada apertura parte de estado
 *  fresco y el efecto solo lanza el fetch (nada de setState síncrono en el cuerpo del efecto). */
function ArsenalObjectHistoryContent({ cardNameById, onClose }: Omit<IArsenalObjectHistoryDialogProps, "isOpen">) {
  const [entries, setEntries] = useState<IPlayerUpgradeHistoryEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/progression/upgrade/history", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("history failed");
        return response.json();
      })
      .then((body: { entries: IPlayerUpgradeHistoryEntry[] }) => {
        if (!cancelled) setEntries(body.entries ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Historial de objetos" onClick={onClose}>
      <div className="flex max-h-[min(34rem,90%)] w-full max-w-md flex-col rounded-2xl border border-amber-400/50 bg-[#0a0703]/97 p-4 shadow-[0_0_45px_rgba(251,191,36,0.28)]" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex shrink-0 items-center gap-2">
          <History className="h-4 w-4 text-amber-300" aria-hidden />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.16em] text-amber-100">Historial de objetos</h2>
        </div>
        {failed ? (
          <p className="m-auto py-8 text-center text-xs text-rose-300">No se pudo cargar el historial. Inténtalo de nuevo.</p>
        ) : entries === null ? (
          <p className="m-auto py-8 text-center font-mono text-xs uppercase tracking-widest text-amber-500/60">Cargando historial…</p>
        ) : entries.length === 0 ? (
          <p className="m-auto max-w-xs py-8 text-center text-xs text-slate-400">
            Aún no has usado ningún objeto. Cuando equipes uno en una carta, quedará registrado aquí.
          </p>
        ) : (
          <ul className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {entries.map((entry, index) => (
              <HistoryEntryRow key={`${entry.appliedAtIso}-${index}`} entry={entry} cardName={cardNameById.get(entry.cardId) ?? entry.cardId} />
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-10 w-full shrink-0 rounded-lg border border-zinc-600/70 font-display text-xs font-black uppercase tracking-wide text-zinc-300 transition hover:border-zinc-400"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function ArsenalObjectHistoryDialog({ isOpen, cardNameById, onClose }: IArsenalObjectHistoryDialogProps) {
  if (!isOpen) return null;
  return <ArsenalObjectHistoryContent cardNameById={cardNameById} onClose={onClose} />;
}
