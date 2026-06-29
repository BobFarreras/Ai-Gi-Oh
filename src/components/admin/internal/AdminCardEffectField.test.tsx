// src/components/admin/internal/AdminCardEffectField.test.tsx - Pruebas del editor de efecto de carta (interpretación + selector de acción).
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminCardEffectField } from "./AdminCardEffectField";

describe("AdminCardEffectField", () => {
  it("interpreta el JSON actual y preselecciona la acción", () => {
    render(<AdminCardEffectField effectJson='{"action":"DAMAGE","target":"OPPONENT","value":300}' isBusy={false} onChange={() => {}} />);
    // La descripción solo aparece en el recuadro de interpretación (no en las opciones del select).
    expect(screen.getByText(/Inflige daño directo al objetivo/i)).toBeInTheDocument();
    const select = screen.getByLabelText<HTMLSelectElement>("Acción del efecto");
    expect(select.value).toBe("DAMAGE");
  });

  it("inserta la plantilla JSON al elegir una acción", () => {
    const onChange = vi.fn();
    render(<AdminCardEffectField effectJson="" isBusy={false} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Acción del efecto"), { target: { value: "HEAL" } });
    expect(onChange).toHaveBeenCalledWith('{"action":"HEAL","target":"PLAYER","value":500}');
  });

  it("avisa cuando el JSON es inválido o desconocido", () => {
    render(<AdminCardEffectField effectJson="no-es-json" isBusy={false} onChange={() => {}} />);
    expect(screen.getByText(/no reconocida o JSON inválido/i)).toBeInTheDocument();
  });
});
