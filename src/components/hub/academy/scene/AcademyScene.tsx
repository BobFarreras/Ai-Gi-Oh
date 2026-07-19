// src/components/hub/academy/scene/AcademyScene.tsx
// Shell 2D de Academy 3D (espejo de HubScene): decide entre el mundo holográfico y el fallback 2D.
// SSR y pre-hidratación renderizan la Academy 2D actual (sin CLS/parpadeo); en cliente con WebGL
// se monta el Canvas holográfico vía next/dynamic(ssr:false). Paso 1: solo el pilar Tutorial.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { TrainingModeSelection } from "@/components/hub/academy/training/TrainingModeSelection";
import { useHubHydrationGate } from "@/components/hub/internal/use-hub-hydration-gate";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { useDocumentVisibility } from "@/components/hub/internal/use-document-visibility";
import { supportsWebGL } from "@/components/hub/internal/hub-webgl-support";
import {
  ACADEMY_GLOSSARY_ROUTE,
  ACADEMY_SKILL_TREE_ROUTE,
  ACADEMY_TRAINING_ARENA_ROUTE,
  ACADEMY_TUTORIAL_MAP_ROUTE,
} from "@/core/constants/routes/academy-routes";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";

// Carga diferida del mundo 3D: el shell 2D aparece al instante y el chunk de Three.js entra
// después, solo en cliente y solo si hay WebGL.
const AcademyWorld3D = dynamic(
  () => import("./AcademyWorld3D").then((mod) => mod.AcademyWorld3D),
  { ssr: false, loading: () => null },
);

// Sonido "de terminal" para la activación/salida de los hologramas (mismo SFX que la landing).
const ACADEMY_TERMINAL_SFX = "/audio/landing/terminal.m4a";

function playSfx(src: string, volume: number, playbackRate = 1): HTMLAudioElement {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  void audio.play().catch(() => undefined);
  return audio;
}

function playHologramHoverSfx(): void {
  playSfx(ONBOARDING_AUDIO_CATALOG.buttonClick, 0.5);
}

function playHologramActivationSfx(): HTMLAudioElement {
  // Ralentizado (playbackRate < 1) para que acompañe a la aparición pausada de los hologramas.
  return playSfx(ACADEMY_TERMINAL_SFX, 0.55, 0.55);
}

// Espera antes de sonar el SFX de activación, para sincronizar con la salida de los hologramas.
const ACTIVATION_SFX_DELAY_MS = 1000;

function playBackSfx(): void {
  playSfx(ONBOARDING_AUDIO_CATALOG.movement, 0.55);
}

// Títulos del carrusel móvil en el MISMO orden que ACADEMY_NODES de AcademyWorld3D. Se mantienen
// locales para no arrastrar el chunk 3D al bundle base; la barra fija del HUD pinta el del nodo activo.
const ACADEMY_MODULE_TITLES = ["Arena", "Tutorial", "Documentación", "Habilidades"];
const ACADEMY_MODULE_COUNT = ACADEMY_MODULE_TITLES.length;

export function AcademyScene() {
  const router = useRouter();
  const { isHydrated } = useHubHydrationGate();
  const viewportWidth = useViewportWidth();
  const isDocumentVisible = useDocumentVisibility();
  const canRender3D = useMemo(() => isHydrated && supportsWebGL(), [isHydrated]);
  const isMobile = viewportWidth < 640;
  // Índice del nodo en el slot de delante del carrusel móvil (0 = Arena, el que arranca al frente).
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  // Audio de activación en curso, para poder pararlo al salir (si no, el terminal.m4a ralentizado
  // sigue sonando en la página de tutorial al navegar).
  const activationAudioRef = useRef<HTMLAudioElement | null>(null);

  const cycleNode = (direction: number): void => {
    playHologramHoverSfx();
    setActiveNodeIndex((current) => (current + direction + ACADEMY_MODULE_COUNT) % ACADEMY_MODULE_COUNT);
  };

  useEffect(() => {
    if (!canRender3D) return;
    router.prefetch(ACADEMY_TUTORIAL_MAP_ROUTE);
    router.prefetch(ACADEMY_TRAINING_ARENA_ROUTE);
    router.prefetch(ACADEMY_GLOSSARY_ROUTE);
    router.prefetch(ACADEMY_SKILL_TREE_ROUTE);
  }, [canRender3D, router]);

  // Al montarse el mundo 3D, el SFX de "terminal" suena tras una espera para cuadrar con la
  // aparición de los hologramas (no de inmediato).
  useEffect(() => {
    if (!canRender3D) return;
    const timer = window.setTimeout(() => {
      activationAudioRef.current = playHologramActivationSfx();
    }, ACTIVATION_SFX_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      // Detiene el SFX si aún suena al desmontar (navegar): no debe colarse en la siguiente página.
      activationAudioRef.current?.pause();
      activationAudioRef.current = null;
    };
  }, [canRender3D]);

  // SSR, pre-hidratación y gama baja/sin-WebGL: Academy 2D actual (fallback nunca peor que hoy).
  if (!canRender3D) {
    return <TrainingModeSelection />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <AcademyWorld3D
          viewportWidth={viewportWidth}
          isDocumentVisible={isDocumentVisible}
          activeNodeIndex={activeNodeIndex}
          onSelect={(route) => {
            // Al hacer click NO suena nada (el SFX de terminal es solo para la aparición al cargar).
            router.push(route);
          }}
          onFocusNode={setActiveNodeIndex}
          onHoverSound={playHologramHoverSfx}
        />
      </div>

      {/* HUD 2D superpuesto (título en DOM, no texto 3D — como el hub). Título compacto para no
          tapar los hologramas en móvil; z-10 lo mantiene sobre el canvas. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 px-4 pt-4 text-center sm:pt-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3 py-1 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">SYS ACADEMY EN LÍNEA</span>
        </div>
        <h1 className="text-lg font-black uppercase tracking-[0.07em] text-white drop-shadow-[0_2px_12px_rgba(2,11,22,0.9)] sm:text-3xl lg:text-4xl">
          Centro de Entrenamiento
        </h1>
        <p className="mx-auto mt-1 max-w-[42ch] text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80 sm:text-sm">
          Selecciona un módulo holográfico
        </p>
      </header>

      <footer className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Barra fija del carrusel móvil: el título NO se mueve (solo pasan los hologramas) y las
            flechas viven dentro del mismo contenedor, flanqueando el nombre del módulo activo. */}
        {isMobile ? (
          <div
            className="flex w-full max-w-xs items-center justify-between gap-2 rounded-full border border-cyan-300/50 bg-[#04121d]/80 px-2 py-1.5 shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-sm"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            <button
              type="button"
              aria-label="Módulo anterior"
              onClick={() => cycleNode(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 text-lg leading-none text-cyan-200 active:scale-95"
            >
              &#9668;
            </button>
            <span className="flex-1 text-center text-sm font-black uppercase tracking-[0.28em] text-cyan-100 [text-shadow:0_0_8px_rgba(34,211,238,0.8)]">
              {ACADEMY_MODULE_TITLES[activeNodeIndex]}
            </span>
            <button
              type="button"
              aria-label="Módulo siguiente"
              onClick={() => cycleNode(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 text-lg leading-none text-cyan-200 active:scale-95"
            >
              &#9658;
            </button>
          </div>
        ) : null}
        <AcademyBackButton label="Volver al Menú" href="/hub" onClick={playBackSfx} className="w-full max-w-xs lg:w-auto" />
      </footer>
    </div>
  );
}
