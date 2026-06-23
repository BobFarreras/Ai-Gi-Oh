// src/core/services/analytics/validate-analytics-event.test.ts - Tests del validador de eventos de analytics: allowlist, tamaño y profundidad.
import { describe, expect, it } from "vitest";
import { IAnalyticsEventInput } from "@/core/entities/analytics/IAnalyticsEvent";
import { sanitizeDeviceInfo, validateAnalyticsBatch, validateAnalyticsEvent, MAX_BATCH_SIZE } from "@/core/services/analytics/validate-analytics-event";

function buildValidEvent(overrides: Partial<IAnalyticsEventInput> = {}): IAnalyticsEventInput {
  return {
    eventName: "page_viewed",
    eventCategory: "navigation",
    properties: { page: "/hub" },
    pageUrl: "/hub",
    timestamp: Date.now(),
    sessionId: "sess-123",
    ...overrides,
  };
}

describe("validateAnalyticsEvent", () => {
  it("acepta un evento válido", () => {
    expect(() => validateAnalyticsEvent(buildValidEvent())).not.toThrow();
  });

  it("rechaza un evento con nombre no permitido", () => {
    expect(() => validateAnalyticsEvent(buildValidEvent({ eventName: "hack_attempt" }))).toThrow();
  });

  it("rechaza una categoría no permitida", () => {
    expect(() => validateAnalyticsEvent(buildValidEvent({ eventCategory: "malware" as never }))).toThrow();
  });

  it("rechaza sessionId vacío", () => {
    expect(() => validateAnalyticsEvent(buildValidEvent({ sessionId: "" }))).toThrow();
  });

  it("rechaza pageUrl demasiado largo", () => {
    expect(() => validateAnalyticsEvent(buildValidEvent({ pageUrl: "a".repeat(501) }))).toThrow();
  });

  it("rechaza properties que exceden el tamaño máximo", () => {
    const huge = { data: "x".repeat(40_000) };
    expect(() => validateAnalyticsEvent(buildValidEvent({ properties: huge }))).toThrow();
  });

  it("rechaza properties con profundidad excesiva", () => {
    const deep = { a: { b: { c: { d: { e: { f: "too deep" } } } } } };
    expect(() => validateAnalyticsEvent(buildValidEvent({ properties: deep }))).toThrow();
  });
});

describe("sanitizeDeviceInfo", () => {
  it("conserva solo los campos del allowlist y descarta los desconocidos", () => {
    const result = sanitizeDeviceInfo({ type: "mobile", os: "iOS", evil: "<script>", nested: { a: 1 } }) as unknown as Record<string, unknown>;
    expect(result.type).toBe("mobile");
    expect(result.os).toBe("iOS");
    expect(result.evil).toBeUndefined();
    expect(result.nested).toBeUndefined();
  });

  it("acota strings gigantes y normaliza tipos inválidos", () => {
    const result = sanitizeDeviceInfo({
      type: "x".repeat(5_000),
      isPwa: "yes",
      deviceMemory: -3,
      hardwareConcurrency: "8",
    });
    expect(result.type.length).toBeLessThanOrEqual(120);
    expect(result.isPwa).toBe(false);
    expect(result.deviceMemory).toBeUndefined();
    expect(result.hardwareConcurrency).toBeUndefined();
  });

  it("devuelve un objeto seguro ante entrada no-objeto", () => {
    expect(() => sanitizeDeviceInfo(null)).not.toThrow();
    expect(sanitizeDeviceInfo("malicious").type).toBe("unknown");
  });
});

describe("validateAnalyticsBatch", () => {
  it("acepta un batch dentro del límite", () => {
    const events = Array.from({ length: 10 }, () => buildValidEvent());
    expect(() => validateAnalyticsBatch(events)).not.toThrow();
  });

  it("rechaza un batch que excede el tamaño máximo", () => {
    const events = Array.from({ length: MAX_BATCH_SIZE + 1 }, () => buildValidEvent());
    expect(() => validateAnalyticsBatch(events)).toThrow();
  });
});
