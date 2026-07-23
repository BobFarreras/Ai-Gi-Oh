// src/services/training/internal/training-opponent-deck-pools.ts - Define variantes de mazo por tier para rotar arquetipos de entrenamiento.
interface ITrainingOpponentDeckVariant {
  id: string;
  deckCardIds: string[];
  fusionDeckCardIds: string[];
}

function toDeck(cardIds: readonly string[]): string[] {
  return [...cardIds];
}

export const TRAINING_OPPONENT_DECK_POOLS: Record<string, ITrainingOpponentDeckVariant[]> = {
  "training-tier-1": [
    {
      id: "starter-tools",
      deckCardIds: toDeck([
        "entity-vscode", "entity-git", "entity-react", "entity-astro", "entity-perplexity",
        "entity-python", "entity-ollama", "entity-n8n", "entity-make", "entity-github",
        "exec-draw-1", "exec-boost-atk-400", "exec-direct-damage-600", "exec-heal-700",
        "trap-atk-drain", "trap-counter-intrusion", "entity-nextjs", "entity-openclaw",
        "entity-supabase", "entity-postgress",
      ]),
      fusionDeckCardIds: ["fusion-pytgress", "fusion-gemgpt"],
    },
    {
      id: "starter-control",
      deckCardIds: toDeck([
        "entity-vscode", "entity-git", "entity-react", "entity-astro", "entity-perplexity",
        "entity-python", "entity-ollama", "entity-n8n", "entity-make", "entity-openclaw",
        "exec-draw-1", "exec-heal-700", "exec-framework-atk-300", "exec-llm-def-300",
        "trap-atk-drain", "trap-counter-intrusion", "trap-def-fragment", "entity-nextjs",
        "entity-supabase", "entity-postgress",
      ]),
      fusionDeckCardIds: ["fusion-pytgress", "fusion-gemgpt"],
    },
  ],
  "training-tier-1-alt": [
    {
      id: "starter-alt-ops",
      deckCardIds: toDeck([
        "entity-vscode", "entity-git", "entity-react", "entity-astro", "entity-perplexity",
        "entity-python", "entity-ollama", "entity-n8n", "entity-make", "entity-github",
        "exec-draw-1", "exec-framework-atk-300", "exec-direct-damage-600", "exec-heal-700",
        "trap-atk-drain", "trap-counter-intrusion", "trap-def-fragment", "entity-nextjs",
        "entity-supabase", "entity-postgress",
      ]),
      fusionDeckCardIds: ["fusion-pytgress", "fusion-gemgpt"],
    },
  ],
  "training-tier-2": [
    {
      id: "framework-burst",
      deckCardIds: toDeck([
        "entity-react", "entity-nextjs", "entity-astro", "entity-huggenface", "entity-vercel",
        "entity-chatgpt", "entity-gemini", "entity-python", "entity-postgress", "entity-supabase",
        "exec-framework-atk-300", "exec-llm-def-300", "exec-draw-1", "exec-direct-damage-900",
        "exec-heal-700", "trap-runtime-punish", "trap-def-fragment", "trap-atk-drain",
        "entity-openclaw", "entity-github",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-pytgress"],
    },
    {
      id: "framework-tempo",
      deckCardIds: toDeck([
        "entity-react", "entity-nextjs", "entity-astro", "entity-vercel", "entity-github",
        "entity-chatgpt", "entity-gemini", "entity-python", "entity-postgress", "entity-supabase",
        "exec-framework-atk-300", "exec-boost-atk-400", "exec-draw-1", "exec-direct-damage-600",
        "exec-heal-700", "trap-runtime-punish", "trap-def-fragment", "trap-counter-intrusion",
        "entity-openclaw", "entity-claude",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-pytgress"],
    },
  ],
  "training-tier-3": [
    {
      id: "fusion-pressure",
      deckCardIds: toDeck([
        "entity-kali-linux", "entity-claude", "entity-deepseek", "entity-chatgpt", "entity-gemini",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-direct-damage-900", "exec-direct-damage-600",
        "exec-llm-def-300", "exec-framework-atk-300", "trap-kernel-panic", "trap-counter-intrusion",
        "trap-runtime-punish", "trap-atk-drain",
      ]),
      fusionDeckCardIds: ["fusion-kaclauli", "fusion-gemgpt"],
    },
    {
      id: "fusion-attrition",
      deckCardIds: toDeck([
        "entity-kali-linux", "entity-claude", "entity-deepseek", "entity-chatgpt", "entity-gemini",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-draw-1", "exec-heal-700",
        "exec-llm-def-300", "exec-boost-atk-400", "trap-kernel-panic", "trap-counter-intrusion",
        "trap-runtime-punish", "trap-def-fragment",
      ]),
      fusionDeckCardIds: ["fusion-kaclauli", "fusion-gemgpt"],
    },
  ],
  "training-tier-4": [
    {
      id: "biglog-offense",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-python",
        "entity-postgress", "entity-react", "entity-nextjs", "entity-openclaw", "entity-deepseek",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-draw-1",
        "exec-boost-atk-400", "exec-direct-damage-900", "trap-kernel-panic", "trap-runtime-punish",
        "trap-counter-intrusion", "trap-atk-drain",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
    {
      id: "biglog-control",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-python",
        "entity-postgress", "entity-react", "entity-nextjs", "entity-openclaw", "entity-deepseek",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-heal-700",
        "exec-llm-def-300", "exec-framework-atk-300", "trap-kernel-panic", "trap-runtime-punish",
        "trap-counter-intrusion", "trap-def-fragment",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
  ],
  "training-tier-5": [
    {
      id: "sentinel-apex",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux",
        "entity-python", "entity-postgress", "entity-deepseek", "entity-nextjs", "entity-react",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-llm-def-300",
        "exec-boost-atk-400", "exec-direct-damage-900", "trap-kernel-panic", "trap-counter-intrusion",
        "trap-runtime-punish", "trap-atk-drain",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
    {
      id: "sentinel-lock",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-python",
        "entity-postgress", "entity-deepseek", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-draw-1",
        "exec-heal-700", "exec-direct-damage-900", "trap-kernel-panic", "trap-counter-intrusion",
        "trap-runtime-punish", "trap-def-fragment",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
  ],
  "training-tier-6": [
    {
      id: "apex-annihilation",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-boost-atk-400",
        "exec-direct-damage-900", "exec-llm-def-300", "trap-kernel-panic", "trap-atk-drain",
        "trap-runtime-punish", "trap-counter-intrusion",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
    {
      id: "apex-lockdown",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-llm-def-300",
        "exec-heal-700", "exec-direct-damage-900", "trap-kernel-panic", "trap-atk-drain",
        "trap-runtime-punish", "trap-def-fragment",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
  ],
  "training-midutech": [
    {
      id: "midutech-offense",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-vercel",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-direct-damage-900", "exec-boost-atk-400",
        "exec-framework-atk-300", "exec-draw-1", "trap-kernel-panic", "trap-runtime-punish",
        "trap-counter-intrusion", "trap-atk-drain",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
    {
      id: "midutech-control",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-supabase",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-llm-def-300", "exec-heal-700",
        "exec-framework-atk-300", "exec-draw-1", "trap-kernel-panic", "trap-runtime-punish",
        "trap-counter-intrusion", "trap-def-fragment",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
  ],
  "training-soldado-laptop": [
    {
      id: "sentinel-firewall",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-direct-damage-900",
        "exec-llm-def-300", "trap-firewall-counter-magic", "trap-flutter-reflect", "trap-kernel-panic",
        "trap-runtime-punish", "trap-counter-intrusion",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
    {
      id: "sentinel-swarm",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-vercel",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-boost-atk-400",
        "exec-direct-damage-900", "trap-firewall-counter-magic", "trap-flutter-reflect", "trap-kernel-panic",
        "trap-atk-drain", "trap-runtime-punish",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
  ],
  "training-gokernel": [
    {
      id: "gokernel-overdrive",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-boost-atk-400",
        "exec-direct-damage-900", "exec-direct-damage-600", "trap-kernel-panic", "trap-runtime-punish",
        "trap-counter-intrusion", "trap-atk-drain",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
    {
      id: "gokernel-ultra",
      deckCardIds: toDeck([
        "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
        "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-vercel",
        "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-boost-atk-400",
        "exec-llm-def-300", "exec-direct-damage-900", "trap-firewall-counter-magic", "trap-kernel-panic",
        "trap-runtime-punish", "trap-atk-drain",
      ]),
      fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
    },
  ],
};
