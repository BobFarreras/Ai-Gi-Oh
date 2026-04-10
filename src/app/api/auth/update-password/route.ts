// src/app/api/auth/update-password/route.ts - Endpoint HTTP para aplicar nueva contraseña en sesión de recuperación.
import { NextRequest } from "next/server";
import { handleUpdatePasswordRequest } from "@/services/auth/api/handle-update-password-request";

export async function POST(request: NextRequest) {
  return handleUpdatePasswordRequest(request);
}
