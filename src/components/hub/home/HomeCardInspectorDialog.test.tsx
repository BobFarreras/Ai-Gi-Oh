// src/components/hub/home/HomeCardInspectorDialog.test.tsx - Verifica que las mutaciones móviles mantengan abierto el inspector.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeCardInspectorDialog } from "./HomeCardInspectorDialog";

vi.mock("@/components/hub/internal/use-hub-module-sfx", () => ({
  useHubModuleSfx: () => ({ play: vi.fn() }),
}));

vi.mock("@/components/hub/home/HomeCardInspector", () => ({
  HomeCardInspector: () => <div>Detalle Python</div>,
}));

vi.mock("@/components/hub/home/HomeInspectorActionButtons", () => ({
  HomeInspectorActionButtons: ({
    onInsert,
    onRemove,
  }: {
    onInsert: () => Promise<void>;
    onRemove: () => Promise<void>;
  }) => (
    <>
      <button type="button" onClick={() => void onInsert()}>Añadir</button>
      <button type="button" onClick={() => void onRemove()}>Retirar</button>
    </>
  ),
}));

const CARD = {
  id: "entity-python",
  name: "Python",
  description: "Carta test",
  type: "ENTITY" as const,
  faction: "NEUTRAL" as const,
  cost: 2,
  attack: 1000,
  defense: 1000,
};

function renderDialog(overrides?: {
  onInsert?: () => Promise<{ ok: boolean; message?: string }>;
  onRemove?: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const onClose = vi.fn();
  const onInsert = overrides?.onInsert ?? vi.fn(async () => ({ ok: true }));
  const onRemove = overrides?.onRemove ?? vi.fn(async () => ({ ok: true }));
  render(
    <HomeCardInspectorDialog
      isOpen
      origin={{ x: 10, y: 10 }}
      selectedCard={CARD}
      selectedCardVersionTier={0}
      selectedCardLevel={0}
      selectedCardXp={0}
      selectedCardMasteryPassiveSkillId={null}
      selectedCardSource="COLLECTION"
      canInsert
      canRemove
      canEvolve={false}
      evolveCost={null}
      onInsert={onInsert}
      onRemove={onRemove}
      onEvolve={vi.fn(async () => ({ ok: true }))}
      onClose={onClose}
    />,
  );
  return { onClose, onInsert, onRemove };
}

describe("HomeCardInspectorDialog", () => {
  it.each(["Añadir", "Retirar"])("mantiene abierto el detalle después de %s", async (actionLabel) => {
    const handlers = renderDialog();
    fireEvent.click(screen.getByRole("button", { name: actionLabel }));
    const action = actionLabel === "Añadir" ? handlers.onInsert : handlers.onRemove;
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Detalle Python")).toBeInTheDocument();
  });

  it("mantiene el detalle abierto y muestra el error de retirada", async () => {
    const handlers = renderDialog({ onRemove: vi.fn(async () => ({ ok: false, message: "Sincronización fallida." })) });
    fireEvent.click(screen.getByRole("button", { name: "Retirar" }));
    await waitFor(() => expect(screen.getByText("Sincronización fallida.")).toBeInTheDocument());
    expect(handlers.onClose).not.toHaveBeenCalled();
  });
});
