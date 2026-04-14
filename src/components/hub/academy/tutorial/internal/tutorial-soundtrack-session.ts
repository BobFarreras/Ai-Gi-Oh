// src/components/hub/academy/tutorial/internal/tutorial-soundtrack-session.ts - Gestiona flags de sesión para activar soundtrack solo durante la primera vuelta del tutorial.
const TUTORIAL_SOUNDTRACK_ACTIVE_KEY = "academy:tutorial-first-run-active";
const TUTORIAL_SOUNDTRACK_FINISHED_KEY = "academy:tutorial-first-run-finished";
export const TUTORIAL_SOUNDTRACK_STATE_EVENT = "academy:tutorial-soundtrack-state-change";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function emitTutorialSoundtrackStateEvent(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TUTORIAL_SOUNDTRACK_STATE_EVENT));
}

/**
 * Activa el soundtrack para la primera vuelta solo si aún no se marcó como finalizada.
 */
export function markTutorialSoundtrackFirstRunStarted(): void {
  if (!canUseSessionStorage()) return;
  if (window.sessionStorage.getItem(TUTORIAL_SOUNDTRACK_FINISHED_KEY) === "1") return;
  window.sessionStorage.setItem(TUTORIAL_SOUNDTRACK_ACTIVE_KEY, "1");
  emitTutorialSoundtrackStateEvent();
}

/**
 * Marca final de la primera vuelta y evita volver a reproducir el soundtrack narrativo.
 */
export function markTutorialSoundtrackFirstRunFinished(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(TUTORIAL_SOUNDTRACK_FINISHED_KEY, "1");
  window.sessionStorage.removeItem(TUTORIAL_SOUNDTRACK_ACTIVE_KEY);
  emitTutorialSoundtrackStateEvent();
}

/**
 * Informa si el soundtrack de primera vuelta debe estar activo en la navegación actual.
 */
export function isTutorialSoundtrackFirstRunActive(): boolean {
  if (!canUseSessionStorage()) return false;
  if (window.sessionStorage.getItem(TUTORIAL_SOUNDTRACK_FINISHED_KEY) === "1") return false;
  return window.sessionStorage.getItem(TUTORIAL_SOUNDTRACK_ACTIVE_KEY) === "1";
}
