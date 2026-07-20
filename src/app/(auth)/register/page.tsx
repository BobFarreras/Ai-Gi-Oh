// src/app/(auth)/register/page.tsx - Página de registro con fondo dinámico y formulario de alta de jugador.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { BackToLandingButton } from "@/components/auth/BackToLandingButton";
import { CyberBackground } from "@/components/landing/CyberBackground";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export const metadata: Metadata = {
  title: "Registrarse gratis",
  description: "Crea tu cuenta gratis en AI-GI-OH: The AGI Wars. Construye tu mazo, fusiona cartas y compite en duelos 1v1 online desde el navegador.",
  alternates: { canonical: "/register" },
};

export default async function RegisterPage() {
  // Si ya hay sesión válida, salta directo al hub en vez de mostrar el alta.
  const session = await getCurrentUserSession();
  if (session) redirect("/hub");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#010308] p-4 sm:p-8 selection:bg-cyan-500/30">
      
      {/* Fondo interactivo de hiperconexiones */}
      <CyberBackground />
      <BackToLandingButton />
      
      {/* Contenedor del formulario */}
      <div className="relative z-10 w-full max-w-md shrink-0">
        <RegisterForm />
      </div>

    </main>
  );
}
