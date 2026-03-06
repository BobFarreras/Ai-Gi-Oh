// src/components/auth/RegisterForm.test.tsx - Pruebas de interacción del formulario de registro.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "@/components/auth/RegisterForm";
import * as authHttpClient from "@/services/auth/auth-http-client";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("muestra error cuando las contraseñas no coinciden", async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText(/email de registro/i), { target: { value: "test@aigi.io" } });
    fireEvent.change(screen.getByLabelText(/^contraseña de registro$/i), { target: { value: "12345678" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña de registro/i), { target: { value: "00000000" } });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
  });

  it("redirige al hub cuando el registro es correcto", async () => {
    vi.spyOn(authHttpClient, "registerWithEmail").mockResolvedValueOnce({ ok: true, message: null });
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/email de registro/i), { target: { value: "test@aigi.io" } });
    fireEvent.change(screen.getByLabelText(/^contraseña de registro$/i), { target: { value: "12345678" } });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña de registro/i), { target: { value: "12345678" } });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/hub"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
