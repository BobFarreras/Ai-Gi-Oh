// src/components/hub/internal/hub-route-prefetch.test.ts - Verifica prefetch único de rutas Hub y compatibilidad sin router.prefetch.
import { describe, expect, it, vi } from "vitest";
import { prefetchHubRoutes } from "@/components/hub/internal/hub-route-prefetch";

describe("hub-route-prefetch", () => {
  it("prefetch solo rutas /hub y elimina duplicados", () => {
    const prefetch = vi.fn();
    prefetchHubRoutes(
      { prefetch },
      ["/hub/market", "/hub/home", "/hub/market", "/login", "https://foo.bar", "/hub/academy"],
    );
    expect(prefetch).toHaveBeenCalledTimes(3);
    expect(prefetch).toHaveBeenNthCalledWith(1, "/hub/market");
    expect(prefetch).toHaveBeenNthCalledWith(2, "/hub/home");
    expect(prefetch).toHaveBeenNthCalledWith(3, "/hub/academy");
  });

  it("no revienta cuando router no expone prefetch", () => {
    expect(() => prefetchHubRoutes({}, ["/hub/market"])).not.toThrow();
  });
});
