// src/components/admin/AdminAuditPanel.test.tsx - Verifica render de filtros, filas y paginación del panel visual de auditoría.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminAuditPanel } from "@/components/admin/AdminAuditPanel";

describe("AdminAuditPanel", () => {
  it("muestra filas de auditoría cuando hay eventos", () => {
    render(
      <AdminAuditPanel
        portalSlug="control-room"
        query={{ page: 1, pageSize: 20 }}
        cardVisualById={{}}
        page={{
          page: 1,
          pageSize: 20,
          total: 1,
          items: [{ id: "audit-1", actorUserId: "admin-1", action: "ADMIN_CATALOG_CARD_UPSERTED", entityType: "cards_catalog", entityId: "entity-vscode", payload: { x: 1 }, createdAtIso: "2026-03-26T10:00:00.000Z" }],
        }}
      />,
    );
    expect(screen.getByText("ADMIN_CATALOG_CARD_UPSERTED")).toBeInTheDocument();
    expect(screen.getByText("entity-vscode")).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no existen eventos", () => {
    render(
      <AdminAuditPanel
        portalSlug="control-room"
        query={{ page: 1, pageSize: 20 }}
        cardVisualById={{}}
        page={{ page: 1, pageSize: 20, total: 0, items: [] }}
      />,
    );
    expect(screen.getByText(/sin eventos/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrar por acción de auditoría")).toBeInTheDocument();
  });
});
