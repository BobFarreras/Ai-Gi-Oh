// src/services/progression/credit-passive-nexus.test.ts - Validación del reporte de Recaudación (ficha 3):
// forma estricta (número finito + uuid) y truncado; reportes rotos no cobran ni tumban el cierre.
import { describe, expect, it } from "vitest";
import { parsePassiveNexusClaim } from "./credit-passive-nexus";

const OPERATION_ID = "3f2c1a10-9b8d-4e5f-a6b7-c8d9e0f1a2b3";

describe("parsePassiveNexusClaim", () => {
  it("acepta un reporte válido y trunca a entero", () => {
    expect(parsePassiveNexusClaim({ passiveNexusEarned: 400.9, passiveNexusOperationId: OPERATION_ID })).toEqual({
      earned: 400,
      operationId: OPERATION_ID,
    });
  });

  it("sin Nexus contado no hay nada que acreditar (null)", () => {
    expect(parsePassiveNexusClaim({ passiveNexusEarned: 0, passiveNexusOperationId: OPERATION_ID })).toBeNull();
    expect(parsePassiveNexusClaim({ passiveNexusEarned: -200, passiveNexusOperationId: OPERATION_ID })).toBeNull();
    expect(parsePassiveNexusClaim({})).toBeNull();
  });

  it("rechaza formas inválidas: earned no numérico, Infinity o uuid malformado", () => {
    expect(parsePassiveNexusClaim({ passiveNexusEarned: "200", passiveNexusOperationId: OPERATION_ID })).toBeNull();
    expect(parsePassiveNexusClaim({ passiveNexusEarned: Infinity, passiveNexusOperationId: OPERATION_ID })).toBeNull();
    expect(parsePassiveNexusClaim({ passiveNexusEarned: 200, passiveNexusOperationId: "no-es-uuid" })).toBeNull();
    expect(parsePassiveNexusClaim({ passiveNexusEarned: 200 })).toBeNull();
  });

  it("NO topa en el cliente/servidor TS: el tope (600/duelo, 1200/día) es de la RPC", () => {
    // Un reporte inflado viaja tal cual; la RPC lo corta. Aquí solo se valida la forma.
    expect(parsePassiveNexusClaim({ passiveNexusEarned: 99999, passiveNexusOperationId: OPERATION_ID })?.earned).toBe(99999);
  });
});
