// src/components/auth/LogoutButton.test.tsx - Verifica modo compacto y confirmación previa al cerrar sesión.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "./LogoutButton";

const push = vi.fn();
const refresh = vi.fn();
const logoutCurrentUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/services/auth/auth-http-client", () => ({
  logoutCurrentUser: (...args: unknown[]) => logoutCurrentUser(...args),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    logoutCurrentUser.mockReset();
    logoutCurrentUser.mockResolvedValue({ ok: true });
  });

  it("no llama al logout si se cancela desde el diálogo", async () => {
    render(<LogoutButton confirmBeforeLogout />);
    fireEvent.click(screen.getByRole("button", { name: "Desconectar del Hub" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar cierre de sesión" }));
    await waitFor(() => expect(logoutCurrentUser).not.toHaveBeenCalled());
  });

  it("renderiza modo icono y cierra sesión cuando se confirma desde el diálogo", async () => {
    render(<LogoutButton iconOnly confirmBeforeLogout />);
    expect(screen.queryByText("Desconectar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Desconectar del Hub" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cierre de sesión" }));
    await waitFor(() => expect(logoutCurrentUser).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
