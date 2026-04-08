// src/components/hub/story/internal/scene/dialog/StorySubmissionTerminalDialog.tsx - Modal terminal para introducir submissions de nodos Story sin usar prompt del navegador.
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface IStorySubmissionTerminalDialogProps {
  isOpen: boolean;
  title: string;
  hint: string;
  placeholder: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

/**
 * Sustituye prompts nativos por una interfaz diegética de terminal para submissions Story.
 */
export function StorySubmissionTerminalDialog(props: IStorySubmissionTerminalDialogProps) {
  const [value, setValue] = useState("");
  return (
    <AnimatePresence>
      {props.isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[75] bg-black/80 backdrop-blur-sm"
        >
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -14, opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="w-full max-w-[620px] rounded-xl border border-cyan-300/45 bg-[#040813]/95 p-5 shadow-[0_0_30px_rgba(34,211,238,0.22)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Neural Terminal</p>
              <h3 className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-cyan-100">{props.title}</h3>
              <p className="mt-3 text-xs text-cyan-200/90">{props.hint}</p>
              <input
                aria-label="Código de submission"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={props.placeholder}
                className="mt-4 w-full rounded border border-cyan-500/45 bg-black/80 px-3 py-2 text-sm text-cyan-100 outline-none placeholder:text-cyan-500/70 focus:border-cyan-300"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue("");
                    props.onCancel();
                  }}
                  className="rounded border border-slate-600 bg-black/70 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.onSubmit(value);
                    setValue("");
                  }}
                  className="rounded border border-cyan-300/70 bg-cyan-950/70 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-100"
                >
                  Enviar Link
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
