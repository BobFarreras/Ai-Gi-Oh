// src/components/hub/academy/training/TrainingMode3DPanel.tsx - Panel Academy con imagen temática, estética táctica y brillo solo en hover.
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export interface ITrainingMode3DPanelProps {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  actionLabel: string;
  theme: "tutorial" | "arena";
  coverImages: string[];
  coverAlt: string;
}

const hoverSpring = { type: "spring", stiffness: 280, damping: 24 } as const;

export function TrainingMode3DPanel(props: ITrainingMode3DPanelProps) {
  // Mantiene codificación por color para identificar rápidamente cada modo.
  const isTutorial = props.theme === "tutorial";
  const toneClass = isTutorial ? "border-cyan-400/60 text-cyan-200" : "border-emerald-400/60 text-emerald-200";
  const sheenColor = isTutorial ? "rgba(34,211,238,0.32)" : "rgba(16,185,129,0.3)";
  const isArenaCollage = !isTutorial && props.coverImages.length > 1;
  const arenaColumns = Math.min(props.coverImages.length, 4);

  return (
    <Link
      href={props.href}
      className="group relative block h-full min-h-[248px] w-full outline-none lg:min-h-0 lg:hover:z-20"
      aria-label={props.title}
    >
      <motion.article
        whileHover={{ y: -3, scale: 1.004 }}
        whileTap={{ scale: 0.995 }}
        transition={hoverSpring}
        className={`relative flex h-full min-h-[248px] flex-col overflow-hidden rounded-[16px] border bg-[#03111f]/86 backdrop-blur-sm shadow-[0_0_26px_rgba(34,211,238,0.16)] lg:rounded-[20px] lg:border ${toneClass}`}
      >
        <div className="pointer-events-none absolute inset-[2px] rounded-[14px] border border-cyan-300/12 lg:rounded-[18px]" />
        <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-cyan-300/55" />
        <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r border-t border-cyan-300/55" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-cyan-300/55" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-cyan-300/55" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:22px_22px] opacity-35" />
        <div
          className="pointer-events-none absolute inset-y-0 -left-[44%] w-[44%] opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[430%] group-hover:opacity-100"
          style={{ background: `linear-gradient(90deg,transparent,${sheenColor},transparent)` }}
        />

        <div className="relative h-[40%] min-h-[106px] w-full overflow-hidden border-b border-slate-700/75">
          {isArenaCollage ? (
            <div className="grid h-full w-full bg-[#04111d]" style={{ gridTemplateColumns: `repeat(${arenaColumns}, minmax(0, 1fr))` }}>
              {props.coverImages.slice(0, arenaColumns).map((coverImage, index) => (
                <div key={coverImage} className="relative overflow-hidden border-r border-slate-700/70 last:border-r-0">
                  <Image
                    src={coverImage}
                    alt={`${props.coverAlt} ${index + 1}`}
                    fill
                    className="object-contain object-bottom opacity-82 transition-opacity duration-300 group-hover:opacity-98"
                    sizes="(max-width: 1024px) 25vw, 12vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <Image
              src={props.coverImages[0]}
              alt={props.coverAlt}
              fill
              className="object-contain object-[50%_80%] opacity-86 transition-opacity duration-300 group-hover:opacity-96"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020b16] via-[#031322]/45 to-transparent" />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between p-3 sm:p-4">
          <div className="text-center">
            <p className={`text-[11px] font-bold uppercase tracking-[0.24em] lg:text-xs ${isTutorial ? "text-cyan-300" : "text-emerald-300"}`}>{props.subtitle}</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.06em] text-white sm:text-[1.75rem] lg:text-[2rem]">{props.title}</h2>
            <p className="mx-auto mt-2 max-w-[34ch] text-base font-semibold leading-snug text-slate-200 lg:text-lg">{props.description}</p>
          </div>

          <footer className="mt-3 border-t border-slate-700/70 pt-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-[0.16em] ${isTutorial ? "text-cyan-300" : "text-emerald-300"}`}>{props.actionLabel}</span>
              <svg className={`h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${isTutorial ? "text-cyan-300" : "text-emerald-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </footer>
        </div>
      </motion.article>
    </Link>
  );
}
