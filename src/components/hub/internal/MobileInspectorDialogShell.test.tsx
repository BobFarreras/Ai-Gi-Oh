// src/components/hub/internal/MobileInspectorDialogShell.test.tsx - Valida bloqueo de cierre del shell mobile durante operaciones activas.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileInspectorDialogShell } from "@/components/hub/internal/MobileInspectorDialogShell";

describe("MobileInspectorDialogShell", () => {
  it("deshabilita botón cerrar cuando isDismissDisabled=true", () => {
    const onClose = vi.fn();
    render(
      <MobileInspectorDialogShell
        isOpen
        origin={{ x: 0, y: 0 }}
        onClose={onClose}
        closeAriaLabel="Cerrar diálogo"
        overlayTopClassName="top-0"
        panelTopClassName="top-0"
        isDismissDisabled
      >
        <div>Contenido</div>
      </MobileInspectorDialogShell>,
    );
    const closeButton = screen.getByRole("button", { name: "Cerrar diálogo" });
    expect(closeButton).toBeDisabled();
    fireEvent.click(closeButton);
    expect(onClose).not.toHaveBeenCalled();
  });
});
