// scripts/performance/baseline-config.mjs - Define perfiles y rutas para la medición automática de baseline móvil.
export const MOBILE_DEVICE = {
  name: "Pixel 7",
  viewport: { width: 412, height: 915 },
  userAgent:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
};

export const NETWORK_PRESETS = {
  realistic: null,
  stress: {
    offline: false,
    latency: 150,
    downloadThroughput: (10 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
  },
};

export function buildScenarios(combatPath) {
  return [
    { id: "home", path: "/hub/home" },
    { id: "market", path: "/hub/market" },
    { id: "combat", path: combatPath },
  ];
}
