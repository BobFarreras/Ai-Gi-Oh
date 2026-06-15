// src/core/config/audio-catalog.ts - Descripción breve del módulo.
export type AudioTrackId =
  // Música de fondo en loop durante el duelo.
  | "SOUNDTRACK"
  // Impacto general de daño (ataques físicos o efectos fuertes).
  | "DAMAGE"
  // Pérdida de LP del jugador objetivo.
  | "LIFE_LOSS"
  // Declaración de ataque de entidad.
  | "ATTACK"
  // Activación ofensiva de carta mágica.
  | "MAGIC_ATTACK"
  // Aparición de banner central (turno/fase).
  | "BANNER"
  // Robo de carta.
  | "DRAW_CARD"
  // Invocación normal de carta al campo.
  | "SUMMON_CARD"
  // Invocación por fusión.
  | "FUSION_SUMMON"
  // Paso de turno.
  | "TURN_PASS"
  // Resultado: victoria del jugador local.
  | "DUEL_WIN"
  // Resultado: derrota del jugador local.
  | "GAME_OVER"
  // Resultado: empate.
  | "DUEL_DRAW"
  // Sonido inmediatamente al terminar el temporizador.
  | "TIMER_END"
  // Aviso de 5 segundos restantes.
  | "TIMER_WARNING"
  // Apertura de panel lateral.
  | "SIDEBAR_OPEN"
  // Cierre de panel lateral.
  | "SIDEBAR_CLOSE"
  // Error de acción o validación.
  | "ERROR_ACTION"
  // Click de botones importantes de UI.
  | "BUTTON_CLICK"
  // Stinger adicional de celebración en victoria.
  | "VICTORY_STINGER";

export interface IAudioTrackConfig {
  path: string;
  volume: number;
  loop?: boolean;
}

export const AUDIO_CATALOG: Record<AudioTrackId, IAudioTrackConfig> = {
  SOUNDTRACK: { path: "/audio/music/soundtrack.m4a", volume: 0.4, loop: true },
  DAMAGE: { path: "/audio/sfx/damage.m4a", volume: 0.75 },
  LIFE_LOSS: { path: "/audio/sfx/life-loss.m4a", volume: 0.8 },
  ATTACK: { path: "/audio/landing/formulario.m4a", volume: 0.55 },
  MAGIC_ATTACK: { path: "/audio/sfx/magic-attack.m4a", volume: 0.75 },
  BANNER: { path: "/audio/sfx/banner.m4a", volume: 0.55 },
  DRAW_CARD: { path: "/audio/sfx/draw-card.m4a", volume: 0.55 },
  SUMMON_CARD: { path: "/audio/sfx/summon-card.m4a", volume: 0.6 },
  FUSION_SUMMON: { path: "/audio/sfx/fusion-summon.m4a", volume: 0.85 },
  TURN_PASS: { path: "/audio/sfx/turn-pass.m4a", volume: 0.55 },
  DUEL_WIN: { path: "/audio/sfx/win.m4a", volume: 0.9 },
  GAME_OVER: { path: "/audio/sfx/game-over.m4a", volume: 0.9 },
  DUEL_DRAW: { path: "/audio/sfx/duel-draw.m4a", volume: 0.75 },
  TIMER_END: { path: "/audio/sfx/timer-end.m4a", volume: 0.75 },
  TIMER_WARNING: { path: "/audio/sfx/timer-warning.m4a", volume: 0.7 },
  SIDEBAR_OPEN: { path: "/audio/sfx/sidebar-open.m4a", volume: 0.45 },
  SIDEBAR_CLOSE: { path: "/audio/sfx/sidebar-close.m4a", volume: 0.42 },
  ERROR_ACTION: { path: "/audio/sfx/error-action.m4a", volume: 1.12 },
  BUTTON_CLICK: { path: "/audio/sfx/button-click.m4a", volume: 0.38 },
  VICTORY_STINGER: { path: "/audio/sfx/victory-stinger.m4a", volume: 0.75 },
};

export const AUDIO_CHANNEL_VOLUME = {
  music: 0.8,
  sfx: 1,
};

