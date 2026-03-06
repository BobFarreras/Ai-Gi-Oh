// src/core/use-cases/player/GetOrCreatePlayerProfileUseCase.ts - Garantiza perfil de jugador persistido y devuelve su estado actual.
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProfile } from "@/core/entities/player/IPlayerProfile";
import { IPlayerProfileRepository } from "@/core/repositories/IPlayerProfileRepository";

interface IGetOrCreatePlayerProfileInput {
  playerId: string;
  defaultNickname: string;
}

export class GetOrCreatePlayerProfileUseCase {
  constructor(private readonly profileRepository: IPlayerProfileRepository) {}

  async execute(input: IGetOrCreatePlayerProfileInput): Promise<IPlayerProfile> {
    if (!input.playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    const existingProfile = await this.profileRepository.getByPlayerId(input.playerId);
    if (existingProfile) return existingProfile;
    const nowIso = new Date().toISOString();
    return this.profileRepository.create({
      playerId: input.playerId,
      nickname: input.defaultNickname.trim() || "Operador",
      avatarUrl: null,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    });
  }
}
