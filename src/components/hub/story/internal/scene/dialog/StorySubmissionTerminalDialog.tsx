// src/components/hub/story/internal/scene/dialog/StorySubmissionTerminalDialog.tsx - Terminal visual estilo hub para validar llaves y ejecutar submission de Story.
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface IStorySubmissionTerminalDialogProps {
  isOpen: boolean;
  title: string;
  hint: string;
  placeholder: string;
  activationLabel: string;
  generatedCode: string;
  requiredKeys: Array<{ id: string; label: string; isCollected: boolean }>;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

export function StorySubmissionTerminalDialog(props: IStorySubmissionTerminalDialogProps) {
  const [value, setValue] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const hasAllKeys = props.requiredKeys.every((key) => key.isCollected);

  const resetAndCancel = () => {
    setValue("");
    setIsConnecting(false);
    setHasConnected(false);
    props.onCancel();
  };
  const submit = () => {
    props.onSubmit(value);
    setValue("");
    setIsConnecting(false);
    setHasConnected(false);
  };
  const connectKeys = () => {
    if (!hasAllKeys || isConnecting) return;
    setIsConnecting(true);
    window.setTimeout(() => {
      setIsConnecting(false);
      setHasConnected(true);
      setValue(props.generatedCode);
    }, 900);
  };

  return (
    <AnimatePresence>
      {props.isOpen ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[75] bg-[#01040a]/85 backdrop-blur-sm">
          <div className="hub-control-room-bg absolute inset-0 flex items-center justify-center overflow-hidden px-4">
            <div aria-hidden className="hub-control-scan absolute inset-0 opacity-45" />
            <div aria-hidden className="hub-control-flow-lines absolute inset-0 opacity-25" />
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -18, opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="hub-control-panel-frame relative w-full max-w-[760px] overflow-hidden bg-[#030b17]/96 p-0"
              style={{ clipPath: "polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px)" }}
            >
              <div aria-hidden className="hub-control-panel-glow absolute inset-0 opacity-70" />
              <div aria-hidden className="hub-control-grid absolute inset-0 opacity-20" />
              <header className="relative border-b border-cyan-500/35 bg-black/45 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.9)]" /><span className="h-2.5 w-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.85)]" /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Neural Terminal</p>
                </div>
                <h3 className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-100">{props.title}</h3>
                <p className="mt-1 text-xs text-cyan-200/90">{props.hint}</p>
              </header>
              <div className="relative p-4">
                <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <section className="hub-node-panel relative overflow-hidden border border-cyan-700/45 bg-[#020a12]/78 p-3">
                    <div aria-hidden className="hub-node-scan absolute inset-0 opacity-60" />
                    <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Estado de llaves</p>
                    <ul className="relative mt-2 space-y-2">{props.requiredKeys.map((key) => <li key={key.id} className="flex items-center justify-between rounded border border-cyan-900/70 bg-black/65 px-2 py-1.5 text-xs"><span className="text-cyan-100">{key.label}</span><span className={key.isCollected ? "font-black text-emerald-300" : "font-black text-rose-300"}>{key.isCollected ? "ONLINE" : "MISSING"}</span></li>)}</ul>
                    {!hasAllKeys ? <p className="relative mt-3 border border-rose-400/35 bg-rose-950/35 px-2 py-2 text-xs font-black uppercase tracking-[0.08em] text-rose-300">Faltan llaves de enlace</p> : <div className="relative mt-3 space-y-2"><motion.button type="button" onClick={connectKeys} disabled={isConnecting} animate={isConnecting ? { boxShadow: ["0 0 0 rgba(34,211,238,0)", "0 0 28px rgba(34,211,238,0.55)", "0 0 0 rgba(34,211,238,0)"] } : undefined} transition={isConnecting ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : undefined} className="w-full border border-fuchsia-300/70 bg-fuchsia-950/45 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-100 transition hover:bg-fuchsia-900/55 disabled:cursor-not-allowed disabled:opacity-70" style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>{isConnecting ? "Conectando llaves..." : props.activationLabel}</motion.button>{hasConnected ? <div className="rounded border border-emerald-500/50 bg-emerald-950/35 px-3 py-2 text-xs text-emerald-200">Código generado: <span className="font-black">{props.generatedCode}</span></div> : null}</div>}
                  </section>
                  <section className="hub-node-panel relative overflow-hidden border border-cyan-700/45 bg-[#020a12]/78 p-3">
                    <div aria-hidden className="hub-node-scan absolute inset-0 opacity-50" />
                    <p className="relative text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Consola de firma</p>
                    <div className="relative mt-2 border border-cyan-900/70 bg-black/70 p-2 font-mono text-[11px] text-cyan-200"><p className="opacity-80">&gt; bind --keys alpha beta</p><p className="opacity-80">&gt; handshake --secure tunnel</p><p className="opacity-80">&gt; emit --signature bridge-link</p></div>
                    <input aria-label="Código de submission" value={value} onChange={(event) => setValue(event.target.value)} placeholder={props.placeholder} disabled={!hasAllKeys} className="relative mt-3 w-full border border-cyan-500/55 bg-black/85 px-3 py-2 font-mono text-sm text-cyan-100 outline-none placeholder:text-cyan-500/70 focus:border-cyan-300 disabled:cursor-not-allowed disabled:border-cyan-900/40 disabled:text-cyan-600" />
                    <div className="relative mt-4 flex items-center justify-end gap-2"><button type="button" onClick={resetAndCancel} className="border border-slate-600 bg-black/70 px-3 py-2 text-[11px] font-black uppercase tracking-[0.13em] text-slate-200 transition hover:border-slate-300">Cancelar</button><button type="button" onClick={submit} disabled={!hasAllKeys || !hasConnected || value.trim().length === 0} className="border border-cyan-300/70 bg-cyan-950/70 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-900/80 disabled:cursor-not-allowed disabled:border-cyan-900/40 disabled:text-cyan-600" style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>Ejecutar enlace</button></div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
