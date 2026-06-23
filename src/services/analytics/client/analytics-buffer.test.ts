// src/services/analytics/client/analytics-buffer.test.ts - Tests del buffer singleton: track, sampling, flush, feature flag.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushAnalytics, initAnalytics, resetAnalyticsForTests, track, trackPageView } from "./analytics-buffer";

const originalEnv = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

beforeEach(() => {
  resetAnalyticsForTests();
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
  // jsdom no tiene sendBeacon: lo definimos manualmente.
  if (!navigator.sendBeacon) {
    Object.defineProperty(navigator, "sendBeacon", { value: vi.fn().mockReturnValue(true), configurable: true, writable: true });
  }
  vi.mocked(navigator.sendBeacon).mockClear();
  vi.mocked(navigator.sendBeacon).mockReturnValue(true);
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
});

afterEach(() => {
  resetAnalyticsForTests();
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = originalEnv;
  vi.restoreAllMocks();
});

describe("analytics-buffer", () => {
  it("no trackea si analytics está desactivado", () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "false";
    initAnalytics();
    track("page_viewed", "navigation", { page: "/hub" });
    flushAnalytics();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("no trackea si no se ha inicializado", () => {
    track("page_viewed", "navigation", { page: "/hub" });
    flushAnalytics();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it("trackea y hace flush tras inicializar", () => {
    initAnalytics();
    trackPageView("/hub");
    flushAnalytics();
    expect(navigator.sendBeacon).toHaveBeenCalledWith("/api/analytics/batch", expect.any(String));
  });

  it("el payload del flush contiene los eventos", () => {
    initAnalytics();
    track("duel_started", "gameplay", { mode: "STORY" });
    flushAnalytics();
    const calls = vi.mocked(navigator.sendBeacon).mock.calls;
    const payload = JSON.parse(calls[0][1] as string);
    expect(payload.events).toHaveLength(2); // session_started + duel_started
    expect(payload.events[1].eventName).toBe("duel_started");
  });

  it("no lanza error si sendBeacon falla", () => {
    initAnalytics();
    vi.mocked(navigator.sendBeacon).mockImplementation(() => { throw new Error("network"); });
    expect(() => {
      track("page_viewed", "navigation", { page: "/hub" });
      flushAnalytics();
    }).not.toThrow();
  });
});
