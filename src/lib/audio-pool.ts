// src/lib/audio-pool.ts - Singleton pool de instancias Audio con creación lazy y cacheo por ruta.
// Evita new Audio() eagerly en montaje de componentes. Las instancias se crean
// solo la primera vez que se necesitan y se reutilizan en llamadas posteriores.

const pool = new Map<string, HTMLAudioElement>();

/** Devuelve (o crea lazy) una instancia Audio cacheada por ruta con volumen y loop configurados. */
export function getAudio(path: string, volume = 1, loop = false): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio === "undefined") return null;

  const cacheKey = `${path}|${volume.toFixed(2)}|${loop}`;
  const cached = pool.get(cacheKey);
  if (cached) {
    cached.currentTime = 0;
    return cached;
  }

  const audio = new Audio(path);
  audio.preload = "none";
  audio.volume = Math.max(0, Math.min(1, volume));
  audio.loop = loop;
  pool.set(cacheKey, audio);
  return audio;
}

/** Reproduce un sonido por ruta. Crea la instancia lazy si es la primera vez. */
export function playAudio(path: string, volume = 1, loop = false): void {
  const audio = getAudio(path, volume, loop);
  if (!audio) return;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    void maybePromise.catch(() => undefined);
  }
}

/** Detiene y resetea un audio cacheado por ruta. */
export function stopAudio(path: string, volume = 1, loop = false): void {
  const cacheKey = `${path}|${volume.toFixed(2)}|${loop}`;
  const cached = pool.get(cacheKey);
  if (!cached) return;
  cached.pause();
  cached.currentTime = 0;
}

/** Pausa y resetea todas las instancias activas del pool. */
export function pauseAllAudio(): void {
  for (const audio of pool.values()) {
    audio.pause();
    audio.currentTime = 0;
  }
}

/** Limpia el pool completo. Útil para tests o desmontaje global. */
export function clearAudioPool(): void {
  pauseAllAudio();
  pool.clear();
}