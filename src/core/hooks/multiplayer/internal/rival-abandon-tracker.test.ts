// src/core/hooks/multiplayer/internal/rival-abandon-tracker.test.ts - Tests puros del tracker de abandono del rival.
import { describe, expect, it, vi, afterEach } from "vitest";
import { createRivalAbandonTracker } from "./rival-abandon-tracker";

afterEach(() => {
  vi.useRealTimers();
});

describe("createRivalAbandonTracker", () => {
  it("markConnected detiene cualquier timer activo y notifica elapsed 0 implícito", () => {
    vi.useFakeTimers();
    const tracker = createRivalAbandonTracker(60_000);
    const onTick = vi.fn();
    const onAbandon = vi.fn();
    tracker.markDisconnected(onTick, onAbandon);
    tracker.markConnected();
    vi.advanceTimersByTime(5_000);
    expect(onTick).not.toHaveBeenCalled();
    tracker.dispose();
  });

  it("markDisconnected inicia el ticking cada 1s", () => {
    vi.useFakeTimers();
    const tracker = createRivalAbandonTracker(60_000);
    const onTick = vi.fn();
    tracker.markDisconnected(onTick, vi.fn());
    vi.advanceTimersByTime(3_000);
    expect(onTick).toHaveBeenCalledTimes(3);
    tracker.dispose();
  });

  it("llama a onAbandon cuando elapsed >= timeoutMs", () => {
    vi.useFakeTimers();
    const tracker = createRivalAbandonTracker(3_000);
    const onAbandon = vi.fn();
    tracker.markDisconnected(vi.fn(), onAbandon);
    vi.advanceTimersByTime(3_000);
    expect(onAbandon).toHaveBeenCalledTimes(1);
    tracker.dispose();
  });

  it("detiene el timer tras onAbandon (no sigue tickeando)", () => {
    vi.useFakeTimers();
    const tracker = createRivalAbandonTracker(2_000);
    const onTick = vi.fn();
    tracker.markDisconnected(onTick, vi.fn());
    vi.advanceTimersByTime(5_000);
    const callsAfterAbandon = onTick.mock.calls.length;
    vi.advanceTimersByTime(5_000);
    expect(onTick.mock.calls.length).toBe(callsAfterAbandon);
    tracker.dispose();
  });

  it("dispose detiene el timer", () => {
    vi.useFakeTimers();
    const tracker = createRivalAbandonTracker(60_000);
    const onTick = vi.fn();
    tracker.markDisconnected(onTick, vi.fn());
    tracker.dispose();
    vi.advanceTimersByTime(10_000);
    expect(onTick).not.toHaveBeenCalled();
  });

  it("markConnected tras markDisconnected reinicia el estado", () => {
    vi.useFakeTimers();
    const tracker = createRivalAbandonTracker(5_000);
    const onTick = vi.fn();
    tracker.markDisconnected(onTick, vi.fn());
    vi.advanceTimersByTime(2_000);
    expect(onTick).toHaveBeenCalledTimes(2);
    tracker.markConnected();
    onTick.mockClear();
    vi.advanceTimersByTime(10_000);
    expect(onTick).not.toHaveBeenCalled();
    tracker.dispose();
  });
});
