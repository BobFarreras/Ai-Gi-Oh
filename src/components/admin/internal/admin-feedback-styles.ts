// src/components/admin/internal/admin-feedback-styles.ts - Estilo del aviso de estado de los paneles admin por TONO.
// Un único mapa para que "error" se vea igual de rojo en todos los paneles (antes cada uno lo deducía del texto).
import { AdminFeedbackTone } from "@/components/admin/internal/use-admin-feedback";

export const ADMIN_FEEDBACK_TONE_CLASS: Record<AdminFeedbackTone, string> = {
  SUCCESS: "border-emerald-500/60 bg-emerald-950/30 text-emerald-200",
  ERROR: "border-rose-500/60 bg-rose-950/30 text-rose-200",
  INFO: "border-slate-500/60 bg-slate-900/50 text-slate-200",
};
