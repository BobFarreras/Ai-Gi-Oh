// src/app/presentacion-tfm/page.tsx - Entry point server de la presentación web del TFM.
import type { Metadata } from "next";
import { TFMPresentationPage } from "@/components/tfm/TFMPresentationPage";

export const metadata: Metadata = {
  title: "Presentación TFM",
  description: "Presentación técnica y narrativa del proyecto AI-GI-OH en formato web.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Renderiza la página oculta de presentación para defensa del TFM.
 */
export default function TFMPresentationRoute() {
  return <TFMPresentationPage />;
}
