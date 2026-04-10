// src/components/auth/RecoverPasswordForm.test.tsx - Pruebas de interacción para solicitud de recuperación de contraseña.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecoverPasswordForm } from "@/components/auth/RecoverPasswordForm";
import * as authHttpClient from "@/services/auth/auth-http-client";

describe("RecoverPasswordForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra mensaje de confirmación cuando la solicitud se envía", async () => {
    vi.spyOn(authHttpClient, "requestPasswordRecovery").mockResolvedValueOnce({
      ok: true,
      message: "Si existe una cuenta con ese email, enviaremos un enlace de recuperación.",
    });
    render(<RecoverPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email para recuperar contraseña/i), { target: { value: "test@aigi.io" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace de recuperación/i }));
    await waitFor(() => {
      expect(screen.getByText(/si existe una cuenta con ese email/i)).toBeInTheDocument();
    });
  });

  it("muestra error cuando el endpoint falla", async () => {
    vi.spyOn(authHttpClient, "requestPasswordRecovery").mockResolvedValueOnce({
      ok: false,
      message: "Error en recuperación.",
    });
    render(<RecoverPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email para recuperar contraseña/i), { target: { value: "test@aigi.io" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace de recuperación/i }));
    expect(await screen.findByText(/error en recuperación/i)).toBeInTheDocument();
  });
});
