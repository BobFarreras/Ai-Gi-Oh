// src/components/hub/story/overworld/hud/OverworldActBadge.tsx - Badge de acto que aparece al entrar (estilo banner de combate).
"use client";

import { useEffect, useMemo, useState } from "react";

interface IOverworldActBadgeProps {
  /** Id del mapa/acto (p. ej. "act-3"): dedupe por sesión para no repetir el badge en cada duelo. */
  mapId: string;
  /** Título del acto (p. ej. "Acto 3 · Repositorio Fantasma"). Se parte por "·". */
  arcTitle: string;
}

function badgeStorageKey(mapId: string): string {
  return `overworld-act-badge-${mapId}`;
}

/**
 * Muestra "ACTO N · Nombre" al entrar a un acto para que el jugador sepa dónde está. Una sola vez
 * por acto y sesión (no reaparece al volver de cada duelo); se desvanece solo tras unos segundos.
 */
export function OverworldActBadge({ mapId, arcTitle }: IOverworldActBadgeProps) {
  // Arranca visible (coincide con el render de servidor: sin hydration mismatch). El efecto decide,
  // ya en cliente, si ocultarlo al instante (ya visto en esta sesión) o tras unos segundos (primera vez).
  const [visible, setVisible] = useState(true);

  const { actLabel, subtitle } = useMemo(() => {
    const [head, ...rest] = arcTitle.split("·");
    return { actLabel: head.trim(), subtitle: rest.join("·").trim() };
  }, [arcTitle]);

  useEffect(() => {
    const key = badgeStorageKey(mapId);
    let alreadyShown = false;
    try {
      alreadyShown = Boolean(window.sessionStorage.getItem(key));
      if (!alreadyShown) window.sessionStorage.setItem(key, "1");
    } catch {
      // Sin sessionStorage: se muestra igual (peor caso, reaparece), no bloquea nada.
    }
    // Ya visto (p. ej. al volver de un duelo): se retira al instante. Primera vez: se luce ~3.4 s.
    const timer = window.setTimeout(() => setVisible(false), alreadyShown ? 0 : 3400);
    return () => window.clearTimeout(timer);
  }, [mapId]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center px-4">
      <div className="overworld-act-badge-anim rounded-2xl border border-cyan-300/50 bg-slate-950/85 px-8 py-4 text-center shadow-[0_0_45px_rgba(6,182,212,0.4)] backdrop-blur-sm">
        <p className="text-xl font-black uppercase tracking-[0.32em] text-cyan-200 sm:text-2xl">{actLabel}</p>
        {subtitle ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80 sm:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
