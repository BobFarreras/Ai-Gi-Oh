// src/components/hub/internal/update-player-profile-name-action.ts - Cliente HTTP para actualizar nickname del perfil desde UI Hub.
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProfile } from "@/core/entities/player/IPlayerProfile";

type PlayerProfileUpdateStrategy = "force" | "bootstrap_if_default";

interface IPlayerProfileUpdateResponse {
  profile: IPlayerProfile;
  applied: boolean;
}

interface IUpdatePlayerProfileNameInput {
  nickname: string;
  strategy?: PlayerProfileUpdateStrategy;
}

/**
 * Persiste nickname en backend con estrategia de actualización configurable.
 */
export async function updatePlayerProfileNameAction(input: IUpdatePlayerProfileNameInput): Promise<IPlayerProfileUpdateResponse> {
  const response = await fetch("/api/player/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nickname: input.nickname,
      strategy: input.strategy ?? "force",
    }),
  });
  if (!response.ok) {
    let message = "No se pudo actualizar el nombre del operador.";
    try {
      const payload = (await response.json()) as { message?: string };
      if (typeof payload.message === "string" && payload.message.trim()) {
        message = payload.message;
      }
    } catch {
      // Ignora parse failures y usa mensaje genérico.
    }
    throw new ValidationError(message);
  }
  return (await response.json()) as IPlayerProfileUpdateResponse;
}

