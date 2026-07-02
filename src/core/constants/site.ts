// src/core/constants/site.ts - Config central del sitio para SEO/GEO (metadata, OpenGraph, sitemap,
// robots y structured data). Punto único de verdad del dominio y los textos de marca.

/**
 * URL canónica del sitio (sin barra final). Configurable por entorno para preview/staging; por
 * defecto el dominio de producción. Debe ser absoluta (Next la usa como `metadataBase`).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-gi-oh.es").replace(/\/+$/, "");

export const SITE_NAME = "AI-GI-OH";
export const SITE_TAGLINE = "The AGI Wars";

/** Título por defecto (landing) y base para el template de las demás páginas. */
export const SITE_TITLE = `${SITE_NAME} · ${SITE_TAGLINE}`;

/** Descripción SEO (~155 caracteres). En español: la audiencia y la UI del juego lo son. */
export const SITE_DESCRIPTION =
  "AI-GI-OH: The AGI Wars. Juego de cartas estratégico por turnos ambientado en la guerra de las IAs (AGI). Crea tu mazo, fusiona cartas y compite en duelos 1v1 online. Gratis en el navegador.";

/** Descripción larga para structured data / llms.txt (motores de IA y rich results). */
export const SITE_LONG_DESCRIPTION =
  "AI-GI-OH (The AGI Wars) es un juego de cartas coleccionables estratégico y por turnos, jugable gratis desde el navegador. Ambientado en la guerra de las inteligencias artificiales generales (AGI), el jugador construye y evoluciona su mazo, fusiona cartas para crear entidades más potentes, progresa por una campaña narrativa y compite en duelos 1v1 en tiempo real con ELO y matchmaking.";

export const SITE_LOCALE = "es_ES";
export const SITE_LANG = "es-ES";

/** Imagen social (OpenGraph/Twitter). Relativa: `metadataBase` la resuelve a absoluta. */
export const SITE_OG_IMAGE = "/assets/readme/hub-ui-overview.webp";

/** Palabras clave semilla (Google las ignora en meta, pero sirven de referencia y para GEO). */
export const SITE_KEYWORDS = [
  "AI-GI-OH",
  "AI GI OH",
  "The AGI Wars",
  "juego de cartas",
  "juego de cartas estratégico",
  "juego de cartas online",
  "duelo de cartas",
  "TCG",
  "trading card game",
  "juego de cartas IA",
  "juego por turnos",
  "fusión de cartas",
  "juego de navegador gratis",
  "cartas coleccionables",
  "multijugador 1v1",
];
