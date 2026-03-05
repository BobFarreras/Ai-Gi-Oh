// src/app/register/page.tsx - Renderiza pantalla de alta de cuenta para acceso inicial al hub.
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 py-8">
      <RegisterForm />
    </main>
  );
}
