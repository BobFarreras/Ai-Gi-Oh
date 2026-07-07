// src/components/hub/story/overworld/engine/SpriteCache.ts - Cache de imágenes para dibujar sprites reales en el canvas del overworld.

interface ICachedSprite {
  image: HTMLImageElement;
  isReady: boolean;
  hasFailed: boolean;
}

/**
 * Carga y cachea imágenes por `src`. El render consulta `get()` cada frame:
 * mientras la imagen no está lista devuelve `null` (el renderer dibuja un
 * placeholder procedural), y aparece sola cuando termina de cargar.
 */
export class SpriteCache {
  private readonly sprites = new Map<string, ICachedSprite>();
  private isDisposed = false;

  /** Precarga una imagen (idempotente). Ignora entradas vacías. */
  load(src: string | undefined | null): void {
    if (this.isDisposed || !src || this.sprites.has(src)) return;
    const image = new Image();
    const entry: ICachedSprite = { image, isReady: false, hasFailed: false };
    image.onload = () => {
      entry.isReady = true;
    };
    image.onerror = () => {
      entry.hasFailed = true;
    };
    image.decoding = "async";
    image.src = src;
    this.sprites.set(src, entry);
  }

  /** Precarga varias imágenes de una vez. */
  loadAll(sources: ReadonlyArray<string | undefined | null>): void {
    for (const src of sources) this.load(src);
  }

  /** Imagen lista para dibujar, o `null` si aún carga o falló. */
  get(src: string | undefined | null): HTMLImageElement | null {
    if (!src) return null;
    const entry = this.sprites.get(src);
    if (!entry || !entry.isReady || entry.hasFailed) return null;
    return entry.image;
  }

  dispose(): void {
    this.isDisposed = true;
    for (const entry of this.sprites.values()) {
      entry.image.onload = null;
      entry.image.onerror = null;
    }
    this.sprites.clear();
  }
}
