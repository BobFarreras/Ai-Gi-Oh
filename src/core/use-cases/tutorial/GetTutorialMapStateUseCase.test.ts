// src/core/use-cases/tutorial/GetTutorialMapStateUseCase.test.ts - Valida salida del caso de uso del mapa tutorial con nodos abiertos.
import { describe, expect, it } from "vitest";
import { GetTutorialMapStateUseCase } from "@/core/use-cases/tutorial/GetTutorialMapStateUseCase";

describe("GetTutorialMapStateUseCase", () => {
  it("expone nodos disponibles al inicio sin bloqueo secuencial", () => {
    const useCase = new GetTutorialMapStateUseCase();
    const runtime = useCase.execute({ completedNodeIds: [] });
    expect(runtime.length).toBeGreaterThan(0);
    expect(runtime.every((node) => node.state === "AVAILABLE")).toBe(true);
  });
});
