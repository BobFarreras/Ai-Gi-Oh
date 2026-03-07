// src/components/hub/story/story-circuit-layout.ts - Define posiciones del diagrama de nodos Story en vista desktop y móvil.
interface IStoryCircuitPosition {
  left: string;
  top: string;
}

const DESKTOP_PATH: ReadonlyArray<IStoryCircuitPosition> = [
  { left: "10%", top: "58%" },
  { left: "28%", top: "36%" },
  { left: "48%", top: "52%" },
  { left: "68%", top: "30%" },
  { left: "86%", top: "48%" },
];

const MOBILE_PATH: ReadonlyArray<IStoryCircuitPosition> = [
  { left: "18%", top: "14%" },
  { left: "72%", top: "26%" },
  { left: "18%", top: "44%" },
  { left: "72%", top: "62%" },
  { left: "20%", top: "80%" },
];

export function resolveStoryNodePosition(index: number, isMobile: boolean): IStoryCircuitPosition {
  const source = isMobile ? MOBILE_PATH : DESKTOP_PATH;
  if (index < source.length) return source[index];
  const last = source[source.length - 1];
  const overflow = index - source.length + 1;
  return { left: last.left, top: `${Math.min(90, Number.parseFloat(last.top) + overflow * 8)}%` };
}
