// src/components/hub/internal/use-hub-node-navigation.test.tsx - Verifica que el hook de navegación dispara push tras targeting y bloquea dobles clicks.
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHubNodeNavigation } from "@/components/hub/internal/use-hub-node-navigation";

describe("use-hub-node-navigation", () => {
  it("lanza router.push después del targeting", async () => {
    const push = vi.fn();
    const { result } = renderHook(() => useHubNodeNavigation({ router: { push } }));
    act(() => {
      result.current.requestNavigation("market", "/hub/market");
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/hub/market");
    });
  });

  it("ignora segundo click mientras está navegando", async () => {
    const push = vi.fn();
    const { result } = renderHook(() => useHubNodeNavigation({ router: { push } }));
    act(() => {
      result.current.requestNavigation("market", "/hub/market");
      result.current.requestNavigation("home", "/hub/home");
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/hub/market");
    });
  });
});
