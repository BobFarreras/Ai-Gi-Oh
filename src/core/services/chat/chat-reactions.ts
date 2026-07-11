// src/core/services/chat/chat-reactions.ts - Emojis permitidos para reaccionar y su validación.
import { ValidationError } from "@/core/errors/ValidationError";

/** Paleta fija de reacciones (evita emojis arbitrarios y mantiene la UI consistente). */
export const CHAT_REACTION_EMOJIS = ["👍", "🔥", "😂", "❤️", "🎉", "😮"] as const;

const ALLOWED = new Set<string>(CHAT_REACTION_EMOJIS);

export function assertValidReactionEmoji(emoji: unknown): string {
  if (typeof emoji !== "string" || !ALLOWED.has(emoji)) {
    throw new ValidationError("Reacción no permitida.");
  }
  return emoji;
}
