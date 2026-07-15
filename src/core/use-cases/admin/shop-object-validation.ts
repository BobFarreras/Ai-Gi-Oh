// src/core/use-cases/admin/shop-object-validation.ts - Validación compartida de los comandos de objetos del
// mercado. Refleja los CHECK de la BD (migraciones 120/123) para fallar pronto y con mensaje claro, antes de
// tocar la base de datos.
import { ValidationError } from "@/core/errors/ValidationError";

/** IDs de objeto: slug estable en minúsculas (p. ej. "candy-usb-raro-1", "item-nucleo-overclock"). */
const SHOP_OBJECT_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function assertShopObjectId(id: string): void {
  if (!SHOP_OBJECT_ID_PATTERN.test(id)) {
    throw new ValidationError("El id del objeto debe ser un slug en minúsculas (letras, números y guiones).");
  }
}

export function assertNonEmptyName(name: string): void {
  if (name.trim().length === 0) throw new ValidationError("El nombre del objeto es obligatorio.");
}

export function assertPriceNexus(priceNexus: number): void {
  if (!Number.isInteger(priceNexus) || priceNexus < 0) {
    throw new ValidationError("El precio en Nexus debe ser un entero mayor o igual que 0.");
  }
}

export function assertCandyLevels(levels: number): void {
  if (!Number.isInteger(levels) || levels < 1 || levels > 5) {
    throw new ValidationError("Los niveles del caramelo deben ser un entero entre 1 y 5.");
  }
}

export function assertUpgradeValue(value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError("El valor de la mejora debe ser un entero mayor que 0.");
  }
}

export function normalizeImageUrl(imageUrl: string | null): string | null {
  if (imageUrl === null) return null;
  const trimmed = imageUrl.trim();
  return trimmed.length === 0 ? null : trimmed;
}
