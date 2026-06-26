// src/app/layout.tsx - Layout raíz: fuentes, metadata global y botón de perfil de efectos visuales.
import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import { PerformanceProfileToggle } from "@/components/internal/PerformanceProfileToggle";
import { shouldRenderPerformanceToggle } from "@/components/internal/should-render-performance-toggle";
import { AnalyticsInitializer } from "@/services/analytics/client/AnalyticsInitializer";
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

export const metadata: Metadata = {
  title: {
    default: "AI-GI-OH",
    template: "%s | AI-GI-OH",
  },
  description: "Juego de cartas estratégico AI-GI-OH.",
  applicationName: "AI-GI-OH",
  manifest: "/favicon/site.webmanifest",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        {children}
        <AnalyticsInitializer />
        {shouldRenderPerformanceToggle(process.env.NODE_ENV) ? <PerformanceProfileToggle /> : null}
      </body>
    </html>
  );
}

