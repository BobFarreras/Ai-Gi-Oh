// src/core/services/opponent/difficulty/story-ai-profile.ts - Normaliza y resuelve perfil IA Story (style/aggression) por dificultad.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export type StoryAiStyle = "balanced" | "aggressive" | "combo" | "control";

export interface IStoryAiProfile {
  style: StoryAiStyle;
  aggression: number;
}

const VALID_STYLES = new Set<StoryAiStyle>(["balanced", "aggressive", "combo", "control"]);

function clampAggression(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function resolveDefaultStoryAiProfile(difficulty: StoryOpponentDifficulty): IStoryAiProfile {
  if (difficulty === "ROOKIE") return { style: "balanced", aggression: 0.41 };
  if (difficulty === "STANDARD") return { style: "aggressive", aggression: 0.62 };
  if (difficulty === "ELITE") return { style: "combo", aggression: 0.66 };
  if (difficulty === "BOSS") return { style: "combo", aggression: 0.68 };
  return { style: "combo", aggression: 0.78 };
}

export function normalizeStoryAiProfile(value: unknown, difficulty: StoryOpponentDifficulty): IStoryAiProfile {
  const fallback = resolveDefaultStoryAiProfile(difficulty);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const candidate = value as { style?: unknown; aggression?: unknown };
  const style = typeof candidate.style === "string" && VALID_STYLES.has(candidate.style as StoryAiStyle) ? candidate.style as StoryAiStyle : fallback.style;
  const rawAggression = typeof candidate.aggression === "number" ? candidate.aggression : Number(candidate.aggression);
  const aggression = Number.isFinite(rawAggression) ? clampAggression(rawAggression) : fallback.aggression;
  return { style, aggression };
}
