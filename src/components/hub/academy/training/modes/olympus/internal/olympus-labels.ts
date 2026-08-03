// src/components/hub/academy/training/modes/olympus/internal/olympus-labels.ts - Traduce los códigos del catálogo a lo que lee el jugador.

const AI_PROFILE_LABEL: Record<string, string> = {
  MYTHIC: "Mítica",
  AGGRESSIVE: "Agresiva",
  DEFENSIVE: "Defensiva",
  BALANCED: "Equilibrada",
  TRICKSTER: "Tramposa",
};

/** El perfil de IA es un enum del catálogo: sin traducir, la UI enseñaría «MYTHIC» al jugador. */
export function describeAiProfile(aiProfile: string): string {
  return AI_PROFILE_LABEL[aiProfile] ?? aiProfile;
}
