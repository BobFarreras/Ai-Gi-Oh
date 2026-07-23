// src/components/admin/internal/use-admin-feedback.ts - Mensaje de estado de los paneles admin, con TONO explícito.
// Antes cada panel adivinaba si un mensaje era error buscando "no se pudo" dentro del texto, así que un error de
// validación del servidor ("level debe estar entre 0 y 30…") se pintaba en VERDE, como si hubiera guardado bien.
// Aquí el tono lo decide quien emite el mensaje, que es el único que lo sabe.
"use client";

import { useCallback, useMemo, useState } from "react";

export type AdminFeedbackTone = "SUCCESS" | "ERROR" | "INFO";

export interface IAdminFeedback {
  message: string;
  tone: AdminFeedbackTone;
}

export const EMPTY_ADMIN_FEEDBACK: IAdminFeedback = { message: "", tone: "INFO" };

/** Texto legible de un error de API/validación (los errores del panel ya traen `message` + traceId). */
export function resolveAdminErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
}

export interface IAdminFeedbackController {
  feedback: IAdminFeedback;
  clearFeedback: () => void;
  notifySuccess: (message: string) => void;
  /** Aviso neutro (borradores, instrucciones): ni verde de éxito ni rojo de error. */
  notifyInfo: (message: string) => void;
  notifyError: (error: unknown, fallback: string) => void;
}

export function useAdminFeedback(): IAdminFeedbackController {
  const [feedback, setFeedback] = useState<IAdminFeedback>(EMPTY_ADMIN_FEEDBACK);
  const clearFeedback = useCallback(() => setFeedback(EMPTY_ADMIN_FEEDBACK), []);
  const notifySuccess = useCallback((message: string) => setFeedback({ message, tone: "SUCCESS" }), []);
  const notifyInfo = useCallback((message: string) => setFeedback({ message, tone: "INFO" }), []);
  const notifyError = useCallback(
    (error: unknown, fallback: string) => setFeedback({ message: resolveAdminErrorMessage(error, fallback), tone: "ERROR" }),
    [],
  );
  return useMemo(
    () => ({ feedback, clearFeedback, notifySuccess, notifyInfo, notifyError }),
    [feedback, clearFeedback, notifySuccess, notifyInfo, notifyError],
  );
}
