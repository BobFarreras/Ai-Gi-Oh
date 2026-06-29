// src/components/game/card/internal/use-element-width.ts - Hook que mide el ancho real de un elemento vía ResizeObserver para escalado fluido.
"use client";

import { RefObject, useEffect, useState } from "react";

/**
 * Observa el ancho del elemento referenciado y lo expone reactivamente.
 * Devuelve 0 hasta la primera medición, lo que permite diferir el render del
 * contenido escalado hasta conocer el ancho real del contenedor.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setWidth(element.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
