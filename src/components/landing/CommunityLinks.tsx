// src/components/landing/CommunityLinks.tsx - Iconos sociales flotantes con expansión animada en desktop, iconos fijos en móvil, estética glass y audio contextual.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Github } from "lucide-react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { getAudio } from "@/lib/audio-pool";

const GITHUB_URL = "https://github.com/BobFarreras/Ai-Gi-Oh";
const DISCORD_URL = "https://discord.gg/dTsuGswTjc";

const AUDIO_HOVER = "/audio/landing/button-click.m4a";
const AUDIO_HOVER_VOLUME = 0.12;

interface ICommunityLinksProps {
  onAction?: () => void;
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

function playHoverSound() {
  const audio = getAudio(AUDIO_HOVER, AUDIO_HOVER_VOLUME);
  if (audio) {
    audio.currentTime = 0;
    const maybePromise = audio.play();
    if (maybePromise && typeof maybePromise.catch === "function") {
      void maybePromise.catch(() => undefined);
    }
  }
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
};

const iconEntryVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 18 },
  },
};

interface ISocialIconProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  hoverBg: string;
  hoverGlow: string;
  onAction?: () => void;
  isDesktop: boolean;
}

function SocialIcon({ label, href, icon, hoverBg, hoverGlow, onAction, isDesktop }: ISocialIconProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!isDesktop) return;
    playHoverSound();
    setIsExpanded(true);
  }, [isDesktop]);

  const handleMouseLeave = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <motion.div
      className="relative flex-shrink-0"
      variants={iconEntryVariants}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onAction}
        aria-label={label}
        className="group flex h-11 items-center overflow-hidden bg-black/60 backdrop-blur-md transition-colors sm:h-12"
        animate={{
          width: isExpanded ? 220 : 44,
          boxShadow: isExpanded ? `0 0 24px ${hoverGlow}` : "0 0 0px transparent",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        style={{ borderRadius: 4 }}
      >
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center sm:h-12 sm:w-12">
          {icon}
        </span>

        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.12, delay: 0.06 }}
              className="pointer-events-none whitespace-nowrap pr-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:text-xs"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ background: hoverBg }}
        />
      </motion.a>
    </motion.div>
  );
}

export function CommunityLinks({ onAction }: ICommunityLinksProps) {
  const isDesktop = useIsDesktop();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="
        fixed z-[70] flex flex-col gap-2
        left-4 top-4
        md:bottom-6 md:left-6 md:top-auto md:flex-row md:gap-2
      "
    >
      <SocialIcon
        label="Dale una estrella"
        href={GITHUB_URL}
        icon={<Github className="h-5 w-5 text-cyan-300 transition-colors group-hover:text-white" aria-hidden />}
        hoverBg="linear-gradient(90deg, rgba(6,182,212,0.15) 0%, transparent 100%)"
        hoverGlow="rgba(6,182,212,0.4)"
        onAction={onAction}
        isDesktop={isDesktop}
      />
      <SocialIcon
        label="Únete a Discord"
        href={DISCORD_URL}
        icon={<DiscordIcon className="h-5 w-5 text-indigo-300 transition-colors group-hover:text-white" />}
        hoverBg="linear-gradient(90deg, rgba(99,102,241,0.15) 0%, transparent 100%)"
        hoverGlow="rgba(99,102,241,0.4)"
        onAction={onAction}
        isDesktop={isDesktop}
      />
    </motion.div>
  );
}
