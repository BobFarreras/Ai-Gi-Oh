// src/components/auth/LoginForm.test.tsx - Pruebas de interacción del formulario de login y acceso a recuperación de contraseña.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";
import * as authHttpClient from "@/services/auth/auth-http-client";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("expone enlace de recuperación de contraseña", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: /¿olvidaste la contraseña\?/i })).toHaveAttribute("href", "/recover-password");
  });

  it("redirige al hub cuando login es correcto", async () => {
    vi.spyOn(authHttpClient, "loginWithEmail").mockResolvedValueOnce({ ok: true, message: null });
    vi.spyOn(authHttpClient, "hasCurrentAdminSession").mockResolvedValueOnce(false);
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email de acceso/i), { target: { value: "test@aigi.io" } });
    fireEvent.change(screen.getByLabelText(/contraseña de acceso/i), { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/hub"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
