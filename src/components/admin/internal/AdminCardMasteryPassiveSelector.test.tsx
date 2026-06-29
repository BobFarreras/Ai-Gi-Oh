// src/components/admin/internal/AdminCardMasteryPassiveSelector.test.tsx - Pruebas del selector admin de pasiva mastery V5.
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminCardMasteryPassiveSelector } from "./AdminCardMasteryPassiveSelector";

const GET_PAYLOAD = {
  passives: [
    { id: "passive-atk-drain-200", name: "Drenaje de ATK" },
    { id: "passive-reflect-damage-200", name: "Cortafuegos Reactivo" },
  ],
  assignments: { "entity-kali-linux": "passive-atk-drain-200" },
};

function stubFetch() {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    const isPost = init?.method === "POST";
    const body = isPost ? { ok: true } : GET_PAYLOAD;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminCardMasteryPassiveSelector", () => {
  it("carga las pasivas y preselecciona la asignación actual de la carta", async () => {
    stubFetch();
    render(<AdminCardMasteryPassiveSelector cardId="entity-kali-linux" />);
    const select = await screen.findByLabelText<HTMLSelectElement>("Pasiva V5 de la carta");
    await waitFor(() => expect(select.value).toBe("passive-atk-drain-200"));
    expect(screen.getByRole("option", { name: "Cortafuegos Reactivo" })).toBeInTheDocument();
  });

  it("guarda la nueva pasiva con un POST al endpoint", async () => {
    const fetchMock = stubFetch();
    render(<AdminCardMasteryPassiveSelector cardId="entity-kali-linux" />);
    const select = await screen.findByLabelText<HTMLSelectElement>("Pasiva V5 de la carta");
    await waitFor(() => expect(select.value).toBe("passive-atk-drain-200"));

    fireEvent.change(select, { target: { value: "passive-reflect-damage-200" } });
    fireEvent.click(screen.getByLabelText("Guardar pasiva V5 de la carta"));

    await screen.findByText("Pasiva V5 actualizada.");
    const postCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "POST");
    expect(postCall).toBeDefined();
    expect(JSON.parse((postCall?.[1] as RequestInit).body as string)).toEqual({
      cardId: "entity-kali-linux",
      passiveSkillId: "passive-reflect-damage-200",
    });
  });
});
