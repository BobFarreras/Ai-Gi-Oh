// src/app/auth/callback/route.ts - Endpoint App Router que delega el callback auth a la capa de servicios.
import { NextRequest } from "next/server";
import { handleAuthCallbackRequest } from "@/services/auth/handle-auth-callback-request";

export async function GET(request: NextRequest) {
  return handleAuthCallbackRequest(request);
}
