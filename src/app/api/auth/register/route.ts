// src/app/api/auth/register/route.ts - Endpoint HTTP para registrar usuario y abrir sesión en el mismo flujo.
import { NextRequest } from "next/server";
import { handleRegisterRequest } from "@/services/auth/api/handle-register-request";

export async function POST(request: NextRequest) {
  return handleRegisterRequest(request);
}
