// src/components/hub/internal/use-hub-module-sfx.ts - Reproduce efectos de sonido de módulos Hub (Arsenal y Market) con API unificada.
"use client";

import { useCallback, useEffect, useRef } from "react";

export type HubModuleSfxId =
  | "FILTER_OPEN"
  | "FILTER_CLOSE"
  | "DETAIL_OPEN"
  | "DIALOG_CLOSE"
  | "ERROR_COMMON"
  | "SECTION_SWITCH"
  | "INSPECTOR_CLOSE"
  | "REMOVE_CARD"
  | "ADD_CARD"
  | "EVOLUTION_OVERLAY"
  | "EVOLUTION_BUTTON"
  | "BUY_CARD"
  | "BUY_PACK"
  | "PACK_REVEAL"
  | "PACK_CARD_REVEAL";

interface IHubModuleSfxConfig {
  path: string;
  volume: number;
}

const HUB_MODULE_SFX_CATALOG: Record<HubModuleSfxId, IHubModuleSfxConfig> = {
  FILTER_OPEN: { path: "/audio/hub/common/filter.mp3", volume: 0.28 },
  FILTER_CLOSE: { path: "/audio/hub/common/cerrar-filtro.mp3", volume: 0.38 },
  DETAIL_OPEN: { path: "/audio/hub/common/open-detall.mp3", volume: 0.45 },
  DIALOG_CLOSE: { path: "/audio/hub/common/cerrar-dialog.mp3", volume: 0.45 },
  ERROR_COMMON: { path: "/audio/hub/common/error-common.mp3", volume: 0.52 },
  SECTION_SWITCH: { path: "/audio/hub/common/seccion.mp3", volume: 0.42 },
  INSPECTOR_CLOSE: { path: "/audio/hub/common/cerrar-dialog.mp3", volume: 0.45 },
  REMOVE_CARD: { path: "/audio/hub/arsenal/remover.mp3", volume: 0.62 },
  ADD_CARD: { path: "/audio/hub/arsenal/añadir.mp3", volume: 0.62 },
  EVOLUTION_OVERLAY: { path: "/audio/hub/arsenal/evolution.mp3", volume: 0.72 },
  EVOLUTION_BUTTON: { path: "/audio/landing/button-click.mp3", volume: 0.35 },
  BUY_CARD: { path: "/audio/hub/market/comprar-carta.mp3", volume: 0.68 },
  BUY_PACK: { path: "/audio/hub/market/comprar-pack.mp3", volume: 0.78 },
  PACK_REVEAL: { path: "/audio/landing/hero.mp3", volume: 0.45 },
  PACK_CARD_REVEAL: { path: "/audio/hub/market/cartas-animacion-pack.mp3", volume: 0.58 },
};

function safeReplay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => undefined);
  }
}

function safePlayTransient(path: string, volume: number): void {
  const audio = new Audio(path);
  audio.preload = "auto";
  audio.volume = volume;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => undefined);
  }
}

export function useHubModuleSfx() {
  const audioByIdRef = useRef<Partial<Record<HubModuleSfxId, HTMLAudioElement>>>({});
  const lastPlayByIdRef = useRef<Partial<Record<HubModuleSfxId, number>>>({});

  useEffect(() => {
    const audioMap = audioByIdRef.current;
    const entries = Object.entries(HUB_MODULE_SFX_CATALOG) as Array<[HubModuleSfxId, IHubModuleSfxConfig]>;
    for (const [id, config] of entries) {
      const audio = new Audio(config.path);
      audio.preload = "auto";
      audio.volume = config.volume;
      audioMap[id] = audio;
    }
    return () => {
      const isJsdom = typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("jsdom");
      for (const id of Object.keys(audioMap) as HubModuleSfxId[]) {
        const audio = audioMap[id];
        if (!audio) continue;
        if (!isJsdom) {
          audio.pause();
        }
        audio.currentTime = 0;
        audioMap[id] = undefined;
      }
    };
  }, []);

  const play = useCallback((id: HubModuleSfxId) => {
    const config = HUB_MODULE_SFX_CATALOG[id];
    const now = Date.now();
    const last = lastPlayByIdRef.current[id] ?? 0;
    if (id === "EVOLUTION_OVERLAY" && now - last < 280) return;
    lastPlayByIdRef.current[id] = now;
    if (id === "PACK_CARD_REVEAL") {
      safePlayTransient(config.path, config.volume);
      return;
    }
    safeReplay(audioByIdRef.current[id] ?? null);
  }, []);

  return { play };
}
