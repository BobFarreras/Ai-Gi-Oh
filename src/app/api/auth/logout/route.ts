// src/app/api/auth/logout/route.ts - Endpoint HTTP para cerrar sesión y limpiar cookies de autenticación.
import { NextRequest } from "next/server";
import { handleLogoutRequest } from "@/services/auth/api/handle-logout-request";

export async function POST(request: NextRequest) {
  return handleLogoutRequest(request);
}
