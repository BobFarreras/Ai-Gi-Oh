// src/components/hub/home/internal/errors/home-action-error-message.ts - Traduce errores técnicos de acciones de Home a mensajes UX consistentes.
export function resolveHomeActionErrorMessage(error: unknown, fallback: string): string {
  const rawMessage = error instanceof Error ? error.message : fallback;
  if (rawMessage.includes("20 cartas")) {
    return "El deck está completo (20/20). Remueve una carta antes de añadir otra.";
  }
  if (rawMessage.includes("3 copias")) {
    return "Ya tienes 3 copias de esta carta en el deck. Elige otra carta o remueve una copia.";
  }
  if (rawMessage.includes("No tienes más copias")) {
    return "No quedan unidades libres en almacén para esta carta. Remueve una copia del deck o compra más.";
  }
  if (rawMessage.includes("bloque de fusión")) {
    return "Esta carta es de FUSIÓN. Selecciona un slot del bloque de fusión para equiparla.";
  }
  return rawMessage;
}
