// src/core/hooks/multiplayer/useForfeitOnUnload.test.ts - Tests del hook de forfeit al cerrar la pestaña.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { buildForfeitBlob, useForfeitOnUnload } from "./useForfeitOnUnload";

describe("buildForfeitBlob", () => {
  it("construye un Blob application/json con { matchId, outcome: 'LOSE' }", async () => {
    const blob = buildForfeitBlob("match-123");
    expect(blob.type).toBe("application/json");
    const text = await blob.text();
    expect(JSON.parse(text)).toEqual({ matchId: "match-123", outcome: "LOSE" });
  });
});

describe("useForfeitOnUnload", () => {
  const addEventListener = vi.spyOn(window, "addEventListener");
  const removeEventListener = vi.spyOn(window, "removeEventListener");
  const sendBeaconMock = vi.fn().mockReturnValue(true);
  let originalSendBeacon: PropertyDescriptor | undefined;

  beforeEach(() => {
    addEventListener.mockClear();
    removeEventListener.mockClear();
    sendBeaconMock.mockClear();
    sendBeaconMock.mockReturnValue(true);
    // jsdom no implementa sendBeacon: lo inyectamos como propiedad propia.
    originalSendBeacon = Object.getOwnPropertyDescriptor(navigator, "sendBeacon");
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconMock,
      writable: true,
    });
  });

  afterEach(() => {
    if (originalSendBeacon) {
      Object.defineProperty(navigator, "sendBeacon", originalSendBeacon);
    } else {
      delete (navigator as Partial<Navigator>).sendBeacon;
    }
    vi.clearAllMocks();
  });

  it("registra listeners beforeunload y pagehide", () => {
    renderHook(() => useForfeitOnUnload({ matchId: "m1", suppressForfeit: false }));
    const events = addEventListener.mock.calls.map((c) => c[0]);
    expect(events).toContain("beforeunload");
    expect(events).toContain("pagehide");
  });

  it("envía sendBeacon al dispatchar beforeunload si suppressForfeit=false", () => {
    renderHook(() => useForfeitOnUnload({ matchId: "m1", suppressForfeit: false }));
    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [, blob] = sendBeaconMock.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
  });

  it("NO envía sendBeacon si suppressForfeit=true", () => {
    renderHook(() => useForfeitOnUnload({ matchId: "m1", suppressForfeit: true }));
    window.dispatchEvent(new Event("pagehide"));
    expect(sendBeaconMock).not.toHaveBeenCalled();
  });

  it("responta el valor más reciente de suppressForfeit (latest ref)", () => {
    const { rerender } = renderHook(
      ({ suppress }) => useForfeitOnUnload({ matchId: "m1", suppressForfeit: suppress }),
      { initialProps: { suppress: false } },
    );
    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    sendBeaconMock.mockClear();
    rerender({ suppress: true });
    window.dispatchEvent(new Event("beforeunload"));
    expect(sendBeaconMock).not.toHaveBeenCalled();
  });

  it("remueve los listeners al desmontar", () => {
    const { unmount } = renderHook(() => useForfeitOnUnload({ matchId: "m1", suppressForfeit: false }));
    unmount();
    const removedEvents = removeEventListener.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain("beforeunload");
    expect(removedEvents).toContain("pagehide");
  });

  it("no envía duplicados: beforeunload + pagehide solo envían una vez cada evento", () => {
    renderHook(() => useForfeitOnUnload({ matchId: "m1", suppressForfeit: false }));
    window.dispatchEvent(new Event("beforeunload"));
    window.dispatchEvent(new Event("pagehide"));
    // Cada evento dispara su propio handler: 2 envíos totales es aceptable
    // (beforeunload y pagehide pueden dispararse juntos al cerrar en móviles).
    expect(sendBeaconMock).toHaveBeenCalledTimes(2);
  });
});
