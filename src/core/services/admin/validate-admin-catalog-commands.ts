// src/core/services/admin/validate-admin-catalog-commands.ts - Valida invariantes de negocio para comandos administrativos de catálogo y mercado.
import {
  IAdminUpsertCardCatalogCommand,
  IAdminUpsertMarketListingCommand,
  IAdminUpsertMarketPackCommand,
} from "@/core/entities/admin/IAdminCatalogCommands";
import { ValidationError } from "@/core/errors/ValidationError";

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Aplica reglas de coherencia para la carta antes de persistirla en catálogo.
 */
export function validateAdminCardCommand(command: IAdminUpsertCardCatalogCommand): void {
  if (isBlank(command.id) || isBlank(command.name) || isBlank(command.description)) {
    throw new ValidationError("La carta requiere id, nombre y descripción.");
  }
  if (command.cost < 0) throw new ValidationError("El coste de la carta no puede ser negativo.");
  if ((command.type === "ENTITY" || command.type === "FUSION") && (command.attack === null || command.defense === null)) {
    throw new ValidationError("Las cartas ENTITY/FUSION requieren ataque y defensa.");
  }
  if (!(command.type === "ENTITY" || command.type === "FUSION") && (command.attack !== null || command.defense !== null)) {
    throw new ValidationError("Solo ENTITY/FUSION pueden definir ataque y defensa.");
  }
  if (command.type !== "TRAP" && command.trigger !== null) {
    throw new ValidationError("Solo las cartas TRAP pueden definir trigger.");
  }
}

/**
 * Valida que el listing sea consistente con la economía de mercado.
 */
export function validateAdminListingCommand(command: IAdminUpsertMarketListingCommand): void {
  if (isBlank(command.id) || isBlank(command.cardId)) {
    throw new ValidationError("El listing requiere id y cardId.");
  }
  if (command.priceNexus < 0) throw new ValidationError("El precio Nexus no puede ser negativo.");
  if (command.stock !== null && command.stock < 0) throw new ValidationError("El stock no puede ser negativo.");
}

/**
 * Garantiza consistencia de pack y de su pool ponderado.
 */
export function validateAdminPackCommand(command: IAdminUpsertMarketPackCommand): void {
  if (isBlank(command.id) || isBlank(command.name) || isBlank(command.packPoolId)) {
    throw new ValidationError("El pack requiere id, nombre y packPoolId.");
  }
  if (command.priceNexus < 0) throw new ValidationError("El precio del pack no puede ser negativo.");
  if (command.cardsPerPack <= 0) throw new ValidationError("El pack debe entregar al menos 1 carta.");
  if (command.previewCardIds.length === 0) throw new ValidationError("El pack requiere cartas preview.");
  if (command.poolEntries.length === 0) throw new ValidationError("El pack requiere al menos una entrada de pool.");
  for (const entry of command.poolEntries) {
    if (isBlank(entry.id) || isBlank(entry.cardId)) {
      throw new ValidationError("Cada entrada del pool requiere id y cardId.");
    }
    if (entry.weight <= 0) throw new ValidationError("El weight del pool debe ser mayor que cero.");
  }
}
