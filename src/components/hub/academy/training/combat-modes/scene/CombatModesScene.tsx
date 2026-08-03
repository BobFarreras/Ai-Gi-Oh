// src/components/hub/academy/training/combat-modes/scene/CombatModesScene.tsx
// Shell 2D del portal de modos (espejo de AcademyScene): SSR y equipos sin WebGL siguen viendo las
// tres tarjetas de siempre; en cliente con WebGL se monta el mundo 3D por next/dynamic.
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { useHubHydrationGate } from "@/components/hub/internal/use-hub-hydration-gate";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { useDocumentVisibility } from "@/components/hub/internal/use-document-visibility";
import { supportsWebGL } from "@/components/hub/internal/hub-webgl-support";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { CombatModePortal } from "../CombatModePortal";
import { COMBAT_MODE_SCENE_TITLES } from "./internal/combat-modes-scene-config";

// El chunk de Three.js entra solo en cliente y solo si hay WebGL: el shell aparece al instante.
const CombatModesWorld3D = dynamic(
  () => import("./CombatModesWorld3D").then((mod) => mod.CombatModesWorld3D),
  { ssr: false, loading: () => null },
);

export function CombatModesScene() {
  const router = useRouter();
  const isHydrated = useHubHydrationGate();
  const viewportWidth = useViewportWidth();
  const isDocumentVisible = useDocumentVisibility();
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const canRender3D = isHydrated && supportsWebGL();
  const isMobile = viewportWidth < 640;

  const cycleNode = (delta: number): void => {
    const total = COMBAT_MODE_SCENE_TITLES.length;
    setActiveNodeIndex((current) => (current + delta + total) % total);
  };

  // SSR, pre-hidratación y equipos sin WebGL: el portal 2D de siempre. Nunca peor que hoy.
  if (!canRender3D) return <CombatModePortal />;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050a14]">
      <div className="absolute inset-0">
        <CombatModesWorld3D
          viewportWidth={viewportWidth}
          isDocumentVisible={isDocumentVisible}
          activeNodeIndex={activeNodeIndex}
          onSelect={(route) => router.push(route)}
          onFocusNode={setActiveNodeIndex}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-4 text-center sm:pt-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3 py-1 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">Centro de combate</span>
        </div>
        <h1 className="text-lg font-black uppercase tracking-[0.07em] text-white drop-shadow-[0_2px_12px_rgba(2,11,22,0.9)] sm:text-3xl lg:text-4xl">
          Elige tu desafío
        </h1>
        <p className="mx-auto mt-1 max-w-[44ch] text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80 sm:text-sm">
          Tres arenas, tres formas de medirte
        </p>
      </header>

      <footer className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* En móvil el título vive en una barra fija: solo se mueven los hologramas, no el texto. */}
        {isMobile ? (
          <div
            className="flex w-full max-w-xs items-center justify-between gap-2 rounded-full border border-cyan-300/50 bg-[#04121d]/80 px-2 py-1.5 shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-sm"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            <button
              type="button"
              aria-label="Modo anterior"
              onClick={() => cycleNode(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 text-lg leading-none text-cyan-200 active:scale-95"
            >
              &#9668;
            </button>
            <span className="flex-1 text-center text-xs font-black uppercase tracking-[0.2em] text-cyan-100 [text-shadow:0_0_8px_rgba(34,211,238,0.8)]">
              {COMBAT_MODE_SCENE_TITLES[activeNodeIndex]}
            </span>
            <button
              type="button"
              aria-label="Modo siguiente"
              onClick={() => cycleNode(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 text-lg leading-none text-cyan-200 active:scale-95"
            >
              &#9658;
            </button>
          </div>
        ) : null}
        <AcademyBackButton label="Volver a la Academia" href={ACADEMY_HOME_ROUTE} className="w-full max-w-xs lg:w-auto" />
      </footer>
    </div>
  );
}
