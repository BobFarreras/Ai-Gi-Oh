// src/components/auth/ResetPasswordForm.test.tsx - Pruebas del formulario de actualización de contraseña en flujo de recuperación.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import * as authHttpClient from "@/services/auth/auth-http-client";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("muestra error si las contraseñas no coinciden", async () => {
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText(/^nueva contraseña$/i), { target: { value: "12345678" } });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "87654321" } });
    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
  });

  it("redirige a login al actualizar contraseña con éxito", async () => {
    vi.spyOn(authHttpClient, "updateCurrentPassword").mockResolvedValueOnce({ ok: true, message: "Actualizada" });
    render(<ResetPasswordForm />);
    fireEvent.change(screen.getByLabelText(/^nueva contraseña$/i), { target: { value: "12345678" } });
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
