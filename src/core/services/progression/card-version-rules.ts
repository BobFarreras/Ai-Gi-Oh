// src/core/services/progression/card-version-rules.ts - Reglas puras de costes y límites para evolución de versiones V0..V5.
import { ValidationError } from "@/core/errors/ValidationError";

export const MIN_CARD_VERSION_TIER = 0;
export const MAX_CARD_VERSION_TIER = 5;

const COPIES_NEEDED_BY_CURRENT_TIER: Record<number, number> = {
  0: 4,
  1: 8,
  2: 16,
  3: 32,
  4: 64,
};

export function assertValidCardVersionTier(versionTier: number): void {
  if (!Number.isInteger(versionTier) || versionTier < MIN_CARD_VERSION_TIER || versionTier > MAX_CARD_VERSION_TIER) {
    throw new ValidationError("La versión de carta es inválida.");
  }
}

export function getCopiesNeededForNextVersion(versionTier: number): number | null {
  assertValidCardVersionTier(versionTier);
  if (versionTier >= MAX_CARD_VERSION_TIER) return null;
  return COPIES_NEEDED_BY_CURRENT_TIER[versionTier];
}

export function canUpgradeCardVersion(versionTier: number, ownedCopiesInCollection: number): boolean {
  const requiredCopies = getCopiesNeededForNextVersion(versionTier);
  if (requiredCopies === null) return false;
  return ownedCopiesInCollection >= requiredCopies;
}
