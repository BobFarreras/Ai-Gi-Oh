// src/components/hub/internal/use-hub-device-capability.ts - Detecta capacidad del dispositivo para ajustar coste de render del Hub 3D.
"use client";

import { useEffect, useState } from "react";

export interface IHubDeviceCapability {
  prefersReducedMotion: boolean;
  isConstrainedDevice: boolean;
}

function hasMatchMediaApi(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function detectCapability(): IHubDeviceCapability {
  if (typeof window === "undefined") {
    return { prefersReducedMotion: false, isConstrainedDevice: false };
  }

  const prefersReducedMotion = hasMatchMediaApi()
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
  const concurrency = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
  const memory = typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number"
    ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
    : 8;

  return {
    prefersReducedMotion,
    isConstrainedDevice: concurrency <= 4 || memory <= 4,
  };
}

export function useHubDeviceCapability(): IHubDeviceCapability {
  const [capability, setCapability] = useState<IHubDeviceCapability>(() => detectCapability());

  useEffect(() => {
    const syncCapability = (): void => setCapability(detectCapability());
    syncCapability();
    const mediaQuery = hasMatchMediaApi() ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    mediaQuery?.addEventListener("change", syncCapability);
    return () => mediaQuery?.removeEventListener("change", syncCapability);
  }, []);

  return capability;
}
