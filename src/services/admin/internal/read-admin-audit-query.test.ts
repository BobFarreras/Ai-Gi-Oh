// src/services/admin/internal/read-admin-audit-query.test.ts - Valida parsing de filtros seleccionables y presets de fecha para auditoría.
import { describe, expect, it } from "vitest";
import { readAdminAuditPageQuery } from "@/services/admin/internal/read-admin-audit-query";

describe("readAdminAuditPageQuery", () => {
  it("aplica sección y preset de fecha cuando llegan por query string", () => {
    const query = readAdminAuditPageQuery(new URLSearchParams("section=MARKET&datePreset=LAST_7_DAYS&page=2&pageSize=10"));
    expect(query.section).toBe("MARKET");
    expect(query.datePreset).toBe("LAST_7_DAYS");
    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(10);
    expect(typeof query.fromIso).toBe("string");
    expect(typeof query.toIso).toBe("string");
  });

  it("respeta fechas custom cuando el preset es CUSTOM", () => {
    const query = readAdminAuditPageQuery(new URLSearchParams("datePreset=CUSTOM&from=2026-03-01&to=2026-03-31"));
    expect(query.datePreset).toBe("CUSTOM");
    expect(query.fromIso).toBe("2026-03-01");
    expect(query.toIso).toBe("2026-03-31");
  });
});

