// src/app/robots.ts - robots.txt dinámico (/robots.txt).
// Permitimos a TODOS los rastreadores (incluidos los de IA: GPTBot, ClaudeBot, PerplexityBot,
// Google-Extended, etc., que caen bajo "*") para maximizar visibilidad en buscadores y en motores
// generativos (GEO). Solo bloqueamos zonas privadas o sin valor SEO.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin-portal", "/api", "/auth"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
