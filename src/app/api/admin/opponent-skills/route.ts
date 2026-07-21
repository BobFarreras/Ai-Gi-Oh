// src/app/api/admin/opponent-skills/route.ts - CRUD admin de las habilidades de combate de oponentes
// (Arena por tier: opponentId="arena-tier-N"; Story por oponente: opponentId=id del oponente). Gate admin +
// service-role. GET devuelve el catálogo de nodos de stats + los rangos asignados; POST asigna; DELETE quita.
import { NextRequest, NextResponse } from "next/server";
import { OpponentSkillTargetType } from "@/core/entities/progression/IOpponentSkillRank";
import { listOpponentCombatSkillNodes } from "@/core/services/progression/skill-tree/resolve-opponent-combat-modifiers";
import { SupabaseOpponentSkillRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentSkillRepository";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { ValidationError } from "@/core/errors/ValidationError";

function parseType(value: unknown): OpponentSkillTargetType {
  if (value === "arena" || value === "story") return value;
  throw new ValidationError("Tipo de oponente inválido (arena|story).");
}

function requireId(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError("Falta el identificador del oponente.");
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const opponentType = parseType(request.nextUrl.searchParams.get("opponentType"));
    const opponentId = requireId(request.nextUrl.searchParams.get("opponentId"));
    const client = createSupabaseServiceRoleClient();
    const [catalog, ranks] = await Promise.all([
      new SupabaseSkillTreeRepository(client).getActiveCatalog(),
      new SupabaseOpponentSkillRepository(client).getOpponentRanks(opponentId, opponentType),
    ]);
    return NextResponse.json(
      { nodes: listOpponentCombatSkillNodes(catalog), ranks },
      { status: 200, headers: context.response.headers },
    );
  } catch (error) {
    return createApiErrorResponse(error, "No se pudieron cargar las habilidades del oponente.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const body = (await request.json()) as { opponentType?: unknown; opponentId?: unknown; nodeId?: unknown; rank?: unknown };
    const opponentType = parseType(body.opponentType);
    const opponentId = requireId(body.opponentId);
    const nodeId = requireId(body.nodeId);
    const rank = Number(body.rank);
    const repository = new SupabaseOpponentSkillRepository(createSupabaseServiceRoleClient());
    if (Number.isInteger(rank) && rank >= 1) {
      await repository.setOpponentRank(opponentId, opponentType, nodeId, rank);
    } else {
      // rango 0/ inválido = quitar la habilidad (el editor manda 0 al bajar del mínimo).
      await repository.removeOpponentRank(opponentId, opponentType, nodeId);
    }
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la habilidad del oponente.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await createAdminRouteContext(request);
    const body = (await request.json()) as { opponentType?: unknown; opponentId?: unknown; nodeId?: unknown };
    const opponentType = parseType(body.opponentType);
    const opponentId = requireId(body.opponentId);
    const nodeId = requireId(body.nodeId);
    await new SupabaseOpponentSkillRepository(createSupabaseServiceRoleClient()).removeOpponentRank(opponentId, opponentType, nodeId);
    return NextResponse.json({ ok: true }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo eliminar la habilidad del oponente.");
  }
}
