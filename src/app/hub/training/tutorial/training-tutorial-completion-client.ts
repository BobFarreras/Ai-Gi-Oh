// src/app/hub/training/tutorial/training-tutorial-completion-client.ts - Cliente HTTP para registrar tutorial training completado.
/**
 * Notifica al backend que el jugador completó el tutorial de combate.
 */
export async function postTrainingTutorialCompletion(): Promise<void> {
  const response = await fetch("/api/training/tutorial/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) throw new Error("No se pudo marcar el tutorial como completado.");
}
