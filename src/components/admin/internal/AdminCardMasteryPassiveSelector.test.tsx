// src/components/admin/internal/AdminCardMasteryPassiveSelector.test.tsx - Pruebas del selector admin de pasiva (V5 e innata).
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminCardMasteryPassiveSelector } from "./AdminCardMasteryPassiveSelector";

const GET_PAYLOAD = {
  passives: [
    { id: "passive-atk-drain-200", name: "Drenaje de ATK" },
    { id: "passive-reflect-damage-200", name: "Cortafuegos Reactivo" },
  ],
  assignments: { "entity-kali-linux": "passive-atk-drain-200" },
  innateAssignments: { "entity-n8n": "passive-atk-drain-200" },
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
  it("preselecciona la pasiva V5 de la carta (sin marcar innata)", async () => {
    stubFetch();
    render(<AdminCardMasteryPassiveSelector cardId="entity-kali-linux" />);
    const select = await screen.findByLabelText<HTMLSelectElement>("Pasiva de la carta");
    await waitFor(() => expect(select.value).toBe("passive-atk-drain-200"));
    expect(screen.getByLabelText<HTMLInputElement>("Pasiva innata desde V1").checked).toBe(false);
  });

  it("muestra la pasiva innata con el check marcado", async () => {
    stubFetch();
    render(<AdminCardMasteryPassiveSelector cardId="entity-n8n" />);
    const select = await screen.findByLabelText<HTMLSelectElement>("Pasiva de la carta");
    await waitFor(() => expect(select.value).toBe("passive-atk-drain-200"));
    expect(screen.getByLabelText<HTMLInputElement>("Pasiva innata desde V1").checked).toBe(true);
  });

  it("guarda la pasiva con el flag innate en el POST", async () => {
    const fetchMock = stubFetch();
    render(<AdminCardMasteryPassiveSelector cardId="entity-kali-linux" />);
    const select = await screen.findByLabelText<HTMLSelectElement>("Pasiva de la carta");
    await waitFor(() => expect(select.value).toBe("passive-atk-drain-200"));

    fireEvent.change(select, { target: { value: "passive-reflect-damage-200" } });
    fireEvent.click(screen.getByLabelText("Pasiva innata desde V1"));
    fireEvent.click(screen.getByLabelText("Guardar pasiva de la carta"));

    await screen.findByText("Pasiva actualizada.");
    const postCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "POST");
    expect(JSON.parse((postCall?.[1] as RequestInit).body as string)).toEqual({
      cardId: "entity-kali-linux",
      passiveSkillId: "passive-reflect-damage-200",
      innate: true,
    });
  });
});
