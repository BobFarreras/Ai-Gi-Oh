// src/components/hub/market/internal/market-error-message.ts - Normaliza mensajes de error del flujo de compra del Market.
export function mapMarketErrorMessage(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : fallback;
  if (rawMessage.includes("Nexus suficiente")) {
    return "Saldo Nexus insuficiente. Compra cancelada en servidor para proteger tu cuenta.";
  }
  if (rawMessage.includes("stock")) {
    return "No hay stock disponible para esta carta. Prueba con otra opción del mercado.";
  }
  if (rawMessage.includes("no está disponible")) {
    return "Esta carta no está disponible para compra directa. Revisa la sección de packs.";
  }
  return rawMessage;
}
