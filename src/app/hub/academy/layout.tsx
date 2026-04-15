// src/app/hub/academy/layout.tsx - Layout compartido de Academy para montar controladores transversales de experiencia.
import { ReactNode } from "react";
import { AcademyTutorialSoundtrackController } from "@/components/hub/academy/internal/AcademyTutorialSoundtrackController";

interface IAcademyLayoutProps {
  children: ReactNode;
}

export default function AcademyLayout({ children }: IAcademyLayoutProps) {
  return (
    <>
      <AcademyTutorialSoundtrackController />
      {children}
    </>
  );
}
