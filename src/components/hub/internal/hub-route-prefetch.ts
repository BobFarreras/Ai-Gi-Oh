// src/components/hub/internal/hub-route-prefetch.ts - Utilidad pura para prefetch de rutas únicas del Hub sin duplicados.
export interface IHubRouterPrefetch {
  prefetch?: (href: string) => void;
}

export function prefetchHubRoutes(router: IHubRouterPrefetch, hrefs: readonly string[]): void {
  if (typeof router.prefetch !== "function") return;
  const uniqueHrefs = Array.from(new Set(hrefs.filter((href) => href.startsWith("/hub/"))));
  for (const href of uniqueHrefs) router.prefetch(href);
}
