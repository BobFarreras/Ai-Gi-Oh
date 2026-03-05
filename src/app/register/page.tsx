import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="hub-control-room-bg fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden p-4 sm:p-8">
      <div className="m-auto w-full max-w-md shrink-0">
        <RegisterForm />
      </div>
    </main>
  );
}