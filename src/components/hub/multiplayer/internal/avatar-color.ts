// src/components/hub/multiplayer/internal/avatar-color.ts - Deriva un par de colores de gradiente determinista a partir de un playerId estable.
/**
 * Paleta de gradientes ciber/espaciales coherente con el resto del Hub.
 * Cada entrada produce un par [from, to] para fondos de avatar generados.
 */
const AVATAR_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ["from-cyan-500/80", "to-blue-700/80"],
  ["from-emerald-500/80", "to-teal-700/80"],
  ["from-violet-500/80", "to-indigo-700/80"],
  ["from-amber-500/80", "to-orange-700/80"],
  ["from-rose-500/80", "to-pink-700/80"],
  ["from-sky-500/80", "to-cyan-700/80"],
  ["from-fuchsia-500/80", "to-purple-700/80"],
  ["from-lime-500/80", "to-green-700/80"],
];

/**
 * Hash djb2 determinista. Garantiza que el mismo playerId reciba siempre el
 * mismo par de colores, sin depender de Math.random (que rompería SSR y
 * memoización).
 */
function hashId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i += 1) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Devuelve las clases Tailwind `from-*`/`to-*` para el gradiente del avatar
 * generado de un jugador. Determinista y SSR-safe.
 */
export function getAvatarGradientClasses(playerId: string): { from: string; to: string } {
  const [from, to] = AVATAR_GRADIENTS[hashId(playerId) % AVATAR_GRADIENTS.length];
  return { from, to };
}

/**
 * Devuelve la inicial (mayúscula) del nickname, o "?" si está vacío. Usada por
 * los avatares generados sin imagen.
 */
export function getAvatarInitial(nickname: string): string {
  const trimmed = nickname.trim();
  if (trimmed.length === 0) return "?";
  return trimmed.charAt(0).toUpperCase();
}
