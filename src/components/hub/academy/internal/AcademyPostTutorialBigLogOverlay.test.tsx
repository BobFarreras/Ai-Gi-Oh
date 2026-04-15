// src/components/hub/academy/internal/AcademyPostTutorialBigLogOverlay.test.tsx - Valida visibilidad y cierre del overlay post-tutorial en Academy.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademyPostTutorialBigLogOverlay } from "@/components/hub/academy/internal/AcademyPostTutorialBigLogOverlay";

const replaceMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/hub/academy",
  useSearchParams: () => useSearchParamsMock(),
}));

describe("AcademyPostTutorialBigLogOverlay", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useSearchParamsMock.mockReset();
    vi.stubGlobal("Audio", class {
      volume = 0;
      play(): Promise<void> {
        return Promise.resolve();
      }
    });
  });

  it("muestra mensaje cuando llega query de recompensa tutorial", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("tutorialReward=core-ready"));
    render(<AcademyPostTutorialBigLogOverlay />);
    const closeButton = await screen.findByRole("button", { name: /cerrar mensaje de biglog/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.parentElement).toHaveTextContent(/Ya estás preparado para entrar en el/i);
    expect(closeButton.parentElement).toHaveTextContent(/Story/i);
  });

  it("cierra overlay y limpia query al pulsar Entendido", async () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("tutorialReward=core-ready"));
    render(<AcademyPostTutorialBigLogOverlay />);
    fireEvent.click(await screen.findByRole("button", { name: /cerrar mensaje de biglog/i }));
    expect(replaceMock).toHaveBeenCalledWith("/hub/academy");
  });
});
