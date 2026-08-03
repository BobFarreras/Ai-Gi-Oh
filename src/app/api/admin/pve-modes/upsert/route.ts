// src/app/api/admin/pve-modes/upsert/route.ts - Publica configuración versionada y edita leyendas, campeones y nodos de Olimpo.
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/core/errors/ValidationError";
import { createAdminPveModesContext } from "@/services/admin/api/create-admin-pve-modes-context";
import {
  readPublishOlympusSettingsCommand,
  readPublishSurvivalRulesetCommand,
  readUpsertOlympusChampionCommand,
  readUpsertOlympusLegendCommand,
  readUpsertOlympusNodeCommand,
} from "@/services/admin/api/read-admin-pve-command";
import { consumeAdminMutationRateLimit } from "@/services/admin/api/security/admin-rate-limiter";
import { createApiErrorResponse } from "@/services/security/api/create-api-error-response";
import { requireTrustedMutationOrigin } from "@/services/security/api/require-trusted-mutation-origin";

interface IAuditableChange {
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const originGuard = requireTrustedMutationOrigin(request);
  if (originGuard) return originGuard;
  try {
    const context = await createAdminPveModesContext(request);
    const allowed = await consumeAdminMutationRateLimit(request, context.profile.userId, "pve-modes");
    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "Demasiadas mutaciones administrativas. Espera 1 minuto e inténtalo de nuevo." },
        { status: 429, headers: context.response.headers },
      );
    }
    const { type, data } = (await request.json()) as { type?: string; data?: Record<string, unknown> };
    const payload = data ?? {};
    const change = await applyChange(context.repository, type, payload);
    await context.writeAuditLogUseCase.execute({ actorUserId: context.profile.userId, ...change });
    return NextResponse.json({ ok: true, ...change.payload }, { status: 200, headers: context.response.headers });
  } catch (error) {
    return createApiErrorResponse(error, "No se pudo guardar la configuración de los modos PvE.");
  }
}

/** Publicar crea versión nueva; editar leyendas/campeones/nodos sube su `version` sin tocar batallas en curso. */
async function applyChange(
  repository: Awaited<ReturnType<typeof createAdminPveModesContext>>["repository"],
  type: string | undefined,
  payload: Record<string, unknown>,
): Promise<IAuditableChange> {
  switch (type) {
    case "survival-ruleset": {
      const command = readPublishSurvivalRulesetCommand(payload);
      const version = await repository.publishSurvivalRuleset(command);
      return {
        action: "ADMIN_SURVIVAL_RULESET_PUBLISHED",
        entityType: "survival_rulesets",
        entityId: String(version),
        payload: { version, stages: command.stages.length, roster: command.roster.length },
      };
    }
    case "olympus-settings": {
      const command = readPublishOlympusSettingsCommand(payload);
      const version = await repository.publishOlympusSettings(command);
      return {
        action: "ADMIN_OLYMPUS_SETTINGS_PUBLISHED",
        entityType: "olympus_settings",
        entityId: String(version),
        payload: { version, dailyAttemptLimit: command.dailyAttemptLimit, respecCost: command.respecCost },
      };
    }
    case "olympus-legend": {
      const command = readUpsertOlympusLegendCommand(payload);
      await repository.upsertLegend(command);
      return {
        action: "ADMIN_OLYMPUS_LEGEND_SAVED",
        entityType: "olympus_opponents",
        entityId: command.id,
        payload: { isActive: command.isActive, deckCards: command.deckCards.length, fusionCards: command.fusionCards.length },
      };
    }
    case "olympus-champion": {
      const command = readUpsertOlympusChampionCommand(payload);
      await repository.upsertChampion(command);
      return {
        action: "ADMIN_OLYMPUS_CHAMPION_SAVED",
        entityType: "olympus_champions",
        entityId: command.id,
        payload: { requiredTier: command.requiredTier, baseDeckVariantId: command.baseDeckVariantId },
      };
    }
    case "olympus-node": {
      const command = readUpsertOlympusNodeCommand(payload);
      await repository.upsertNode(command);
      return {
        action: "ADMIN_OLYMPUS_NODE_SAVED",
        entityType: "olympus_champion_upgrade_nodes",
        entityId: command.id,
        payload: { championId: command.championId, effectKind: command.effectKind, fragmentCost: command.fragmentCost },
      };
    }
    default:
      throw new ValidationError("Tipo de configuración PvE desconocido.");
  }
}
