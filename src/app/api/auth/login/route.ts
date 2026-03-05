// src/app/api/auth/login/route.ts - Endpoint HTTP para iniciar sesión y persistir cookies de autenticación.
import { NextRequest } from "next/server";
import { handleLoginRequest } from "@/services/auth/api/handle-login-request";

export async function POST(request: NextRequest) {
  return handleLoginRequest(request);
}
