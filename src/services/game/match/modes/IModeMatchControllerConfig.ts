// src/services/game/match/modes/IModeMatchControllerConfig.ts - Define configuración base reutilizable para controllers de modo con interfaz común.
import { IMatchConfig } from "@/core/entities/match";

export type IModeMatchControllerConfig = Omit<IMatchConfig, "mode">;
