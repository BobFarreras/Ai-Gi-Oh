// src/components/hub/internal/HubErrorDialog.test.tsx - Verifica cierre manual/automático y sonido del diálogo de error global.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";

const playMock = vi.fn();

vi.mock("@/components/hub/internal/use-hub-module-sfx", () => ({
  useHubModuleSfx: () => ({ play: playMock }),
}));

describe("HubErrorDialog", () => {
  it("reproduce sonido y ejecuta cierre automático", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<HubErrorDialog title="Error de prueba" message="Fallo crítico" onClose={onClose} autoCloseMs={1500} />);
    expect(playMock).toHaveBeenCalledWith("ERROR_COMMON");
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("permite cerrar manualmente con X", () => {
    const onClose = vi.fn();
    render(<HubErrorDialog title="Error de prueba" message="Fallo crítico" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar diálogo de error" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
