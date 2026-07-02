// src/components/admin/internal/AdminMobileDetailDialog.tsx - Diálogo de detalle para el admin en móvil/tablet (<xl), reutiliza el shell del hub.
"use client";

import { ReactNode } from "react";
import { MobileInspectorDialogShell } from "@/components/hub/internal/MobileInspectorDialogShell";

interface IAdminMobileDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  closeAriaLabel?: string;
  children: ReactNode;
}

/**
 * Muestra el detalle/inspector del admin como diálogo por debajo de `xl` (el shell ya es `xl:hidden`),
 * igual que el inspector móvil de mercado/arsenal. En desktop se sigue usando la columna inline.
 */
export function AdminMobileDetailDialog({ isOpen, onClose, closeAriaLabel = "Cerrar detalle", children }: IAdminMobileDetailDialogProps) {
  return (
    <MobileInspectorDialogShell
      isOpen={isOpen}
      origin={{ x: 0, y: 0 }}
      disableMotion
      onClose={onClose}
      closeAriaLabel={closeAriaLabel}
      overlayTopClassName="top-2"
      panelTopClassName="top-3"
    >
      <div className="home-modern-scroll h-full min-h-0 overflow-y-auto p-3 pt-9">{children}</div>
    </MobileInspectorDialogShell>
  );
}
