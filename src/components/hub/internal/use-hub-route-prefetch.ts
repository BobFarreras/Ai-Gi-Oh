// src/components/hub/internal/use-hub-route-prefetch.ts - Hook cliente para precargar rutas del Hub y reducir latencia al navegar entre secciones.
"use client";

import { useEffect } from "react";
import { prefetchHubRoutes } from "@/components/hub/internal/hub-route-prefetch";

interface UseHubRoutePrefetchInput {
  router: { prefetch?: (href: string) => void };
  hrefs: readonly string[];
}

export function useHubRoutePrefetch({ router, hrefs }: UseHubRoutePrefetchInput) {
  useEffect(() => {
    prefetchHubRoutes(router, hrefs);
  }, [hrefs, router]);
}
