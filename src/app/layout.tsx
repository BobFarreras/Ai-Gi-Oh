// src/app/layout.tsx - Layout raíz: fuentes, metadata global (SEO/GEO), structured data y botón de
// perfil de efectos visuales.
import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Geist, Geist_Mono, Orbitron } from "next/font/google";
import { PerformanceProfileToggle } from "@/components/internal/PerformanceProfileToggle";
import { shouldRenderPerformanceToggle } from "@/components/internal/should-render-performance-toggle";
import { AnalyticsInitializer } from "@/services/analytics/client/AnalyticsInitializer";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LANG,
  SITE_LOCALE,
  SITE_LONG_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
} from "@/core/constants/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente display tecnológica (HUD/sci-fi) para títulos y etiquetas destacadas.
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

// Fuente narrativa sci-fi (cuerpo de lore/historia): más carácter que la sans base, legible en párrafos.
const chakraPetch = Chakra_Petch({
  variable: "--font-narrative",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

// `viewportFit: "cover"` extiende el contenido bajo las áreas seguras (notch, barra de navegación
// del sistema en PWA/standalone) y HABILITA las variables `env(safe-area-inset-*)`. Sin esto, en
// modo app la barra del móvil tapa la parte inferior (p. ej. los controles del overworld).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "game",
  manifest: "/favicon/site.webmanifest",
  // Sin canonical global: en Next se heredaría a TODAS las páginas y marcaría /login y /register como
  // duplicados de la home. Sin él, cada URL se auto-canonicaliza (correcto). Si más adelante alguna
  // página necesita canonical propio, se define en su metadata local.
  // La imagen social la generan opengraph-image.tsx / twitter-image.tsx (tarjeta de marca 1200x630);
  // Next las inyecta automáticamente, por eso aquí no se declara `images`.
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", type: "image/x-icon" },
      { url: "/favicon/icon0.svg", type: "image/svg+xml" },
      { url: "/favicon/icon1.png", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/favicon/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// Structured data (JSON-LD): ayuda a Google (rich results) y a los motores de IA a entender y citar
// el sitio. Grafo WebSite + VideoGame con los datos clave del juego.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: `${SITE_NAME}: ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      inLanguage: SITE_LANG,
    },
    {
      "@type": "VideoGame",
      "@id": `${SITE_URL}/#game`,
      name: SITE_NAME,
      alternateName: `${SITE_NAME}: ${SITE_TAGLINE}`,
      url: `${SITE_URL}/`,
      description: SITE_LONG_DESCRIPTION,
      inLanguage: SITE_LANG,
      image: `${SITE_URL}${SITE_OG_IMAGE}`,
      genre: ["Card game", "Strategy", "Collectible card game"],
      gamePlatform: ["Web browser"],
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      playMode: ["SinglePlayer", "MultiPlayer"],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: algunas extensiones del navegador inyectan atributos en <html>/<body>
    // (p.ej. bis_register, __processed_*) antes de que React hidrate, provocando un falso mismatch. Solo
    // silencia el aviso de estos dos elementos raíz, no de sus hijos.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured data para SEO (rich results de Google) y GEO (motores de IA). */}
        <script
          type="application/ld+json"
          // El contenido es JSON generado por nosotros (sin entrada de usuario): seguro de inyectar.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${chakraPetch.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <AnalyticsInitializer />
        {shouldRenderPerformanceToggle(process.env.NODE_ENV) ? <PerformanceProfileToggle /> : null}
      </body>
    </html>
  );
}

