// src/services/analytics/client/AnalyticsInitializer.tsx - Componente cliente que inicializa analytics y trackea page views en cambios de ruta.
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics } from "./analytics-buffer";
import { trackPageView } from "./analytics-buffer";

/** Monta este componente una sola vez en el layout raíz. No renderiza nada visible. */
export function AnalyticsInitializer() {
  const pathname = usePathname();

  // Inicializa analytics una sola vez al montar la app.
  useEffect(() => {
    initAnalytics();
  }, []);

  // Trackea cada cambio de ruta como page_viewed.
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
