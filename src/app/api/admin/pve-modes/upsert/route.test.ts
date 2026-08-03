// src/app/api/admin/pve-modes/upsert/route.test.ts - Valida gate admin, rate limit, auditoría y publicación versionada.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { POST } from "@/app/api/admin/pve-modes/upsert/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminPveModesContextMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-pve-modes-context", () => ({
  createAdminPveModesContext: (...args: unknown[]) => createAdminPveModesContextMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));

function contextWith(repository: Record<string, unknown>) {
  const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
  createAdminPveModesContextMock.mockResolvedValueOnce({
    profile: { userId: "admin-1" },
    response: NextResponse.json({ ok: true }),
    repository,
    writeAuditLogUseCase,
  });
  return writeAuditLogUseCase;
}

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/pve-modes/upsert", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("pve-modes admin upsert route", () => {
  it("publica el ruleset y deja rastro de la versión creada", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    const publishSurvivalRuleset = vi.fn(async () => 4);
    const audit = contextWith({ publishSurvivalRuleset });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);

    const response = await POST(request({
      type: "survival-ruleset",
      data: {
        startTier: 4, battlesPerTier: 2, roster: ["training-tier-1"],
        milestoneInterval: 5, milestoneHeal: 2000,
        stages: [{
          fromBattle: 1, aiProfile: "HARD", maxTier: 8,
          maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "survival-base",
        }],
      },
    }));

    expect(response.status).toBe(200);
    expect(publishSurvivalRuleset).toHaveBeenCalledTimes(1);
    expect(audit.execute).toHaveBeenCalledWith(expect.objectContaining({
      action: "ADMIN_SURVIVAL_RULESET_PUBLISHED",
      entityType: "survival_rulesets",
      entityId: "4",
    }));
  });

  it("rechaza una configuración inválida sin tocar la base de datos", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    const publishOlympusSettings = vi.fn();
    const audit = contextWith({ publishOlympusSettings });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);

    const response = await POST(request({
      type: "olympus-settings",
      data: { dailyAttemptLimit: 99, battleTtlMinutes: 45, respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 75 },
    }));

    expect(response.status).toBe(400);
    expect(publishOlympusSettings).not.toHaveBeenCalled();
    expect(audit.execute).not.toHaveBeenCalled();
  });

  it("rechaza un tipo de configuración desconocido", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    contextWith({});
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);

    const response = await POST(request({ type: "otro", data: {} }));
    expect(response.status).toBe(400);
  });

  it("devuelve 429 cuando se agota el cupo de mutaciones", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    const publishOlympusSettings = vi.fn();
    contextWith({ publishOlympusSettings });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(false);

    const response = await POST(request({ type: "olympus-settings", data: {} }));
    expect(response.status).toBe(429);
    expect(publishOlympusSettings).not.toHaveBeenCalled();
  });

  it("devuelve 403 cuando el usuario no es admin", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminPveModesContextMock.mockRejectedValueOnce(new AuthorizationError("No autorizado"));

    const response = await POST(request({ type: "olympus-settings", data: {} }));
    expect(response.status).toBe(403);
  });
});
