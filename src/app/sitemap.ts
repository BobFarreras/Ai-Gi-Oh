// src/app/sitemap.ts - Sitemap dinámico (/sitemap.xml) con las rutas públicas indexables.
// El resto de la app (hub, admin, api) está tras autenticación y no aporta valor SEO.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/constants/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
