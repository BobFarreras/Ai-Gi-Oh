// src/services/analytics/client/device-info.ts - Captura información de dispositivo una vez por sesión para adjuntar al batch de analytics.
import { IAnalyticsDeviceInfo } from "@/core/entities/analytics/IAnalyticsEvent";

/** Detecta si el dispositivo es móvil por media query. */
function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

/** Detecta si la app está instalada como PWA. */
function detectPwa(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

/** Detecta el navegador a partir del user agent de forma simplificada. */
function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "other";
}

/** Detecta el sistema operativo a partir del user agent de forma simplificada. */
function detectOs(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  return "other";
}

/** Captura la información de dispositivo del usuario actual. */
export function captureDeviceInfo(): IAnalyticsDeviceInfo {
  if (typeof window === "undefined") {
    return {
      type: "server",
      browser: "unknown",
      os: "unknown",
      isPwa: false,
      screenResolution: "unknown",
      viewportResolution: "unknown",
    };
  }
  return {
    type: detectMobile() ? "mobile" : "desktop",
    browser: detectBrowser(),
    os: detectOs(),
    isPwa: detectPwa(),
    screenResolution: `${screen.width}x${screen.height}`,
    viewportResolution: `${window.innerWidth}x${window.innerHeight}`,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
  };
}
