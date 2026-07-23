// src/components/admin/internal/use-admin-feedback.test.ts - El tono del aviso lo decide quien lo emite, nunca el texto.
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { resolveAdminErrorMessage, useAdminFeedback } from "@/components/admin/internal/use-admin-feedback";

describe("useAdminFeedback", () => {
  it("marca como ERROR un fallo de validación del servidor aunque su texto no diga 'no se pudo'", () => {
    // Este es el caso que se pintaba en verde: el panel adivinaba el tono buscando "no se pudo" en el mensaje.
    const { result } = renderHook(() => useAdminFeedback());
    act(() => result.current.notifyError(new Error("Slot 4 (entity-chatgpt): el nivel debe ser un entero entre 0 y 100."), "No se pudo guardar."));
    expect(result.current.feedback.tone).toBe("ERROR");
    expect(result.current.feedback.message).toContain("el nivel debe ser un entero");
  });

  it("distingue éxito, aviso neutro y limpieza", () => {
    const { result } = renderHook(() => useAdminFeedback());
    act(() => result.current.notifySuccess("Guardado correctamente."));
    expect(result.current.feedback).toEqual({ message: "Guardado correctamente.", tone: "SUCCESS" });
    act(() => result.current.notifyInfo("Borrador clonado."));
    expect(result.current.feedback.tone).toBe("INFO");
    act(() => result.current.clearFeedback());
    expect(result.current.feedback.message).toBe("");
  });

  it("cae al mensaje por defecto si el error no trae texto útil", () => {
    expect(resolveAdminErrorMessage(new Error("   "), "Fallback.")).toBe("Fallback.");
    expect(resolveAdminErrorMessage(null, "Fallback.")).toBe("Fallback.");
    expect(resolveAdminErrorMessage(new Error("Boom"), "Fallback.")).toBe("Boom");
  });
});
