// scripts/performance/baseline-report.test.mjs - Valida la generación de markdown del reporte automático de baseline.
import { describe, expect, it } from "vitest";
import { buildMarkdownReport } from "./baseline-report.mjs";

describe("buildMarkdownReport", () => {
  it("incluye métricas numéricas cuando existen", () => {
    const markdown = buildMarkdownReport({
      generatedAt: "2026-03-09T10:00:00.000Z",
      baseUrl: "http://localhost:3000",
      device: "Pixel 7",
      results: [{ profile: "realistic", scenario: "home", path: "/hub/home", metrics: { lcp: 3200, cls: 0.02, inp: 180 }, error: null }],
    });
    expect(markdown).toContain("LCP: 3200 ms");
    expect(markdown).toContain("CLS: 0.020");
    expect(markdown).toContain("INP: 180 ms");
  });

  it("muestra n/a y errores cuando faltan métricas", () => {
    const markdown = buildMarkdownReport({
      generatedAt: "2026-03-09T10:00:00.000Z",
      baseUrl: "http://localhost:3000",
      device: "Pixel 7",
      results: [{ profile: "stress", scenario: "combat", path: "/hub/story/chapter/1/duel/0", metrics: { lcp: -1, cls: -1, inp: -1 }, error: "Timeout" }],
    });
    expect(markdown).toContain("Error: Timeout");
    expect(markdown).not.toContain("LCP:");
  });
});
