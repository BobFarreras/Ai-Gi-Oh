// src/components/auth/internal/AuthField.test.tsx - Pruebas de accesibilidad y toggle de visibilidad en campo de contraseña.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthField } from "@/components/auth/internal/AuthField";

describe("AuthField", () => {
  it("permite alternar visibilidad cuando el campo es password", () => {
    render(
      <AuthField
        label="Contraseña"
        ariaLabel="Contraseña"
        value="12345678"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        onChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Contraseña");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: /mostrar contraseña/i }));
    expect(input).toHaveAttribute("type", "text");
  });
});
