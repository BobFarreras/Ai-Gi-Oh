// src/components/hub/home/SecondDeckSwitcher.tsx - Switcher del Doble Arsenal (ficha 8, Fase 2). Solo se muestra
// si el jugador tiene la habilidad. Enfoque "editar-activo + swap": editas SIEMPRE el mazo activo con el builder
// normal; este control intercambia activo <-> 2º mazo (RPC atómica) y recarga el arsenal para editar el otro.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Layers } from "lucide-react";

export function SecondDeckSwitcher() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function swap() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/home/deck/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId: crypto.randomUUID() }),
      });
      const result = (await res.json()) as { ok?: boolean; reason?: string };
      if (!res.ok || result.ok === false) {
        setError(result.reason === "no_second_deck" ? "Necesitas la habilidad Doble Arsenal." : "No se pudo cambiar de mazo.");
        return;
      }
      // El 2º mazo pasó a activo: recarga el arsenal para editar/mostrar el nuevo activo.
      router.refresh();
    } catch {
      setError("Error de red al cambiar de mazo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-auto fixed left-1/2 top-2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1 sm:left-auto sm:right-4 sm:translate-x-0">
      <button
        type="button"
        onClick={swap}
        disabled={busy}
        aria-label="Intercambiar con tu segundo mazo (Doble Arsenal)"
        className="inline-flex items-center gap-2 rounded-xl border border-violet-400/50 bg-[#0a0714]/90 px-3 py-2 font-display text-[11px] uppercase tracking-widest text-violet-100 shadow-[0_0_20px_rgba(167,139,250,0.25)] backdrop-blur-sm transition enabled:hover:border-violet-300 enabled:hover:bg-violet-500/15 disabled:opacity-50"
      >
        <Layers className="h-4 w-4 text-violet-300" />
        <span className="hidden sm:inline">Editando mazo activo</span>
        <ArrowLeftRight className="h-4 w-4" />
        <span>{busy ? "Cambiando…" : "Cambiar de mazo"}</span>
      </button>
      {error ? <span className="rounded-md bg-rose-950/80 px-2 py-1 text-[11px] font-semibold text-rose-200">{error}</span> : null}
    </div>
  );
}
