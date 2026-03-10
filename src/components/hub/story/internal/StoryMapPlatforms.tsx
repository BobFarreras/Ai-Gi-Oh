// src/components/hub/story/internal/StoryMapPlatforms.tsx - Renderiza plataformas decorativas no interactivas para dar volumen al mapa Story.
import { IStoryMapPlatformDefinition } from "@/services/story/map-definitions/story-map-definition-types";

interface IStoryMapPlatformsProps {
  platforms: IStoryMapPlatformDefinition[];
}

function resolvePlatformClass(style: IStoryMapPlatformDefinition["style"]): string {
  if (style === "NEON") return "border-cyan-400/40 bg-cyan-950/30 shadow-[0_0_24px_rgba(6,182,212,0.28)]";
  if (style === "RUIN") return "border-amber-700/45 bg-amber-950/25 shadow-[0_0_20px_rgba(217,119,6,0.22)]";
  return "border-slate-500/45 bg-slate-900/55 shadow-[0_0_18px_rgba(148,163,184,0.2)]";
}

export function StoryMapPlatforms({ platforms }: IStoryMapPlatformsProps) {
  return (
    <>
      {platforms.map((platform) => (
        <div
          key={platform.id}
          className={`pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-1/2 rounded-full border ${resolvePlatformClass(platform.style)}`}
          style={{
            left: platform.position.x,
            top: platform.position.y,
            width: platform.size,
            height: platform.size * 0.46,
            transform: `translate(-50%, -50%) rotate(${platform.rotationDeg ?? 0}deg)`,
          }}
        >
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.14),transparent_55%)]" />
        </div>
      ))}
    </>
  );
}
