// src/services/training/internal/training-opponent-presets.ts - Define presets de oponentes por template de tier con identidad visual y deck.
interface ITrainingOpponentPreset {
  storyOpponentId: string;
  codeName: string;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
  deckCardIds: string[];
  fusionDeckCardIds: string[];
}

function toDeck(cardIds: readonly string[]): string[] {
  return [...cardIds];
}

export const TRAINING_OPPONENT_PRESETS: Record<string, ITrainingOpponentPreset> = {
  "training-tier-1": {
    storyOpponentId: "opp-ch1-apprentice",
    codeName: "gen-nvim",
    displayName: "GenNvim",
    avatarUrl: "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png",
    introUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.png",
    deckCardIds: toDeck([
      "entity-vscode", "entity-git", "entity-react", "entity-astro", "entity-perplexity",
      "entity-python", "entity-ollama", "entity-n8n", "entity-make", "entity-github",
      "exec-draw-1", "exec-boost-atk-400", "exec-direct-damage-600", "exec-heal-700",
      "trap-atk-drain", "trap-counter-intrusion", "entity-nextjs", "entity-openclaw",
      "entity-supabase", "entity-postgress",
    ]),
    fusionDeckCardIds: ["fusion-pytgress", "fusion-gemgpt"],
  },
  "training-tier-1-alt": {
    storyOpponentId: "opp-ch1-helena",
    codeName: "nano-ops",
    displayName: "NanoOps",
    avatarUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png",
    introUrl: "/assets/story/opponents/opp-ch1-helena/intro-Helena.png",
    deckCardIds: toDeck([
      "entity-vscode", "entity-git", "entity-react", "entity-astro", "entity-perplexity",
      "entity-python", "entity-ollama", "entity-n8n", "entity-make", "entity-github",
      "exec-draw-1", "exec-framework-atk-300", "exec-direct-damage-600", "exec-heal-700",
      "trap-atk-drain", "trap-counter-intrusion", "trap-def-fragment", "entity-nextjs",
      "entity-supabase", "entity-postgress",
    ]),
    fusionDeckCardIds: ["fusion-pytgress", "fusion-gemgpt"],
  },
  "training-tier-2": {
    storyOpponentId: "opp-ch1-helena",
    codeName: "helena",
    displayName: "Helena",
    avatarUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.png",
    introUrl: "/assets/story/opponents/opp-ch1-helena/intro-Helena.png",
    deckCardIds: toDeck([
      "entity-react", "entity-nextjs", "entity-astro", "entity-huggenface", "entity-vercel",
      "entity-chatgpt", "entity-gemini", "entity-python", "entity-postgress", "entity-supabase",
      "exec-framework-atk-300", "exec-llm-def-300", "exec-draw-1", "exec-direct-damage-900",
      "exec-heal-700", "trap-runtime-punish", "trap-def-fragment", "trap-atk-drain",
      "entity-openclaw", "entity-github",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-pytgress"],
  },
  "training-tier-3": {
    storyOpponentId: "opp-ch1-jaku",
    codeName: "jaku",
    displayName: "Jaku",
    avatarUrl: "/assets/story/opponents/opp-ch1-jaku/avatar-Jaku.png",
    introUrl: "/assets/story/opponents/opp-ch1-jaku/intro-Jaku.png",
    deckCardIds: toDeck([
      "entity-kali-linux", "entity-claude", "entity-deepseek", "entity-chatgpt", "entity-gemini",
      "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-direct-damage-900", "exec-direct-damage-600",
      "exec-llm-def-300", "exec-framework-atk-300", "trap-kernel-panic", "trap-counter-intrusion",
      "trap-runtime-punish", "trap-atk-drain",
    ]),
    fusionDeckCardIds: ["fusion-kaclauli", "fusion-gemgpt"],
  },
  "training-tier-4": {
    storyOpponentId: "opp-ch1-biglog",
    codeName: "biglog",
    displayName: "BigLog",
    avatarUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png",
    introUrl: "/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-python",
      "entity-postgress", "entity-react", "entity-nextjs", "entity-openclaw", "entity-deepseek",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-draw-1",
      "exec-boost-atk-400", "exec-direct-damage-900", "trap-kernel-panic", "trap-gemini-counter-seal",
      "trap-runtime-punish", "trap-counter-intrusion",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
  "training-tier-5": {
    storyOpponentId: "opp-ch1-soldier-act01",
    codeName: "sentinel",
    displayName: "Sentinel Prime",
    avatarUrl: "/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.png",
    introUrl: "/assets/story/opponents/opp-ch1-soldier-act01/intro-Soldado-act01.png",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux",
      "entity-python", "entity-postgress", "entity-deepseek", "entity-nextjs", "entity-react",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-llm-def-300",
      "exec-boost-atk-400", "exec-direct-damage-900", "trap-kernel-panic", "trap-counter-intrusion",
      "trap-runtime-punish", "trap-counter-intrusion",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
};
