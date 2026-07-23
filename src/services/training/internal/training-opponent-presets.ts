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
    storyOpponentId: "opp-gennvim",
    codeName: "gen-nvim",
    displayName: "GenNvim",
    avatarUrl: "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp",
    introUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.webp",
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
    storyOpponentId: "opp-helena",
    codeName: "helena-alt",
    displayName: "Helena",
    avatarUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp",
    introUrl: "/assets/story/opponents/opp-ch1-helena/intro-Helena.webp",
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
    storyOpponentId: "opp-helena",
    codeName: "helena",
    displayName: "Helena",
    avatarUrl: "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp",
    introUrl: "/assets/story/opponents/opp-ch1-helena/intro-Helena.webp",
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
    storyOpponentId: "opp-jaku",
    codeName: "jaku",
    displayName: "Jaku",
    avatarUrl: "/assets/story/opponents/opp-ch1-jaku/avatar-Jaku.webp",
    introUrl: "/assets/story/opponents/opp-ch1-jaku/intro-Jaku.webp",
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
    storyOpponentId: "opp-biglog",
    codeName: "biglog",
    displayName: "BigLog",
    avatarUrl: "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp",
    introUrl: "/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp",
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
    storyOpponentId: "opp-soldier-act01",
    codeName: "soldado",
    displayName: "Soldado",
    avatarUrl: "/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.webp",
    introUrl: "/assets/story/opponents/opp-ch1-soldier-act01/intro-Soldado-act01.webp",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux",
      "entity-python", "entity-postgress", "entity-deepseek", "entity-nextjs", "entity-react",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-llm-def-300",
      "exec-boost-atk-400", "exec-direct-damage-900", "trap-kernel-panic", "trap-counter-intrusion",
      "trap-runtime-punish", "trap-counter-intrusion",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
  "training-tier-6": {
    storyOpponentId: "opp-guill",
    codeName: "guill",
    displayName: "Guill",
    avatarUrl: "/assets/story/opponents/opp-ch1-guill/avatar-Guill.webp",
    introUrl: "/assets/story/opponents/opp-ch1-guill/intro-Guill.webp",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
      "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-boost-atk-400",
      "exec-direct-damage-900", "exec-llm-def-300", "trap-kernel-panic", "trap-atk-drain",
      "trap-runtime-punish", "trap-counter-intrusion",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
  "training-midutech": {
    storyOpponentId: "opp-midutech",
    codeName: "midutech",
    displayName: "Midutech",
    avatarUrl: "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp",
    introUrl: "/assets/story/opponents/opp-ch1-midutech/intro-Midutech.webp",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
      "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-vercel",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-direct-damage-900", "exec-boost-atk-400",
      "exec-framework-atk-300", "exec-draw-1", "trap-kernel-panic", "trap-runtime-punish",
      "trap-counter-intrusion", "trap-atk-drain",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
  // Soldado-Laptop: centinela del Repositorio Fantasma (Acto 3). 7º rival del ladder de arena.
  // Estrena las trampas nuevas del evento: Escudo Firewall (anula magias) y Flutter Enjambre (refleja ataques).
  "training-soldado-laptop": {
    storyOpponentId: "opp-soldado-laptop",
    codeName: "soldado-laptop",
    displayName: "Soldado-Laptop",
    avatarUrl: "/assets/story/opponents/opp-ch3-soldado-laptop/avatar-Soldado-laptop.webp",
    introUrl: "/assets/story/opponents/opp-ch3-soldado-laptop/intro-Soldado-laptop.webp",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
      "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-direct-damage-900",
      "exec-llm-def-300", "trap-firewall-counter-magic", "trap-flutter-reflect", "trap-kernel-panic",
      "trap-runtime-punish", "trap-counter-intrusion",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
  // Gokernel: guerrero núcleo (homenaje cyber). 8º y ÚLTIMO rival del ladder de arena.
  // Deck agresivo provisional (a mejorar): beatdown de alto ATK con fusiones y presión directa.
  "training-gokernel": {
    storyOpponentId: "opp-gokernel",
    codeName: "gokernel",
    displayName: "Gokernel",
    avatarUrl: "/assets/story/opponents/opp-ch3-gokernel/avatar-Gokernel.webp",
    introUrl: "/assets/story/opponents/opp-ch3-gokernel/intro-Gokernel.webp",
    deckCardIds: toDeck([
      "entity-chatgpt", "entity-gemini", "entity-claude", "entity-kali-linux", "entity-deepseek",
      "entity-python", "entity-postgress", "entity-nextjs", "entity-react", "entity-openclaw",
      "exec-fusion-gemgpt", "exec-fusion-kaclauli", "exec-fusion-pytgress", "exec-boost-atk-400",
      "exec-direct-damage-900", "exec-direct-damage-600", "trap-kernel-panic", "trap-runtime-punish",
      "trap-counter-intrusion", "trap-atk-drain",
    ]),
    fusionDeckCardIds: ["fusion-gemgpt", "fusion-kaclauli"],
  },
};
