/**
 * Shared preloader & Canvas 2D renderer for Blender 5.2 PBR transparent PNG sprites.
 * Safe in headless/Vitest environments where `Image` may not load network resources.
 */

const spriteCache = new Map<string, HTMLImageElement>();

export const preloadBlenderSprites = (urls: readonly string[]): void => {
  if (typeof Image === 'undefined') return;
  for (const url of urls) {
    if (!spriteCache.has(url)) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      spriteCache.set(url, img);
    }
  }
};

export const getLoadedBlenderSprite = (url: string): HTMLImageElement | null => {
  if (typeof Image === 'undefined') return null;
  let img = spriteCache.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    spriteCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
};

/**
 * Draws a centered Blender sprite onto a 2D canvas.
 * Returns true if the sprite was loaded and drawn, false so caller can fall back gracefully.
 */
export const drawBlenderSprite = (
  ctx: CanvasRenderingContext2D,
  url: string,
  cx: number,
  cy: number,
  width: number,
  height: number = width,
): boolean => {
  const img = getLoadedBlenderSprite(url);
  if (!img) return false;
  ctx.drawImage(img, cx - width / 2, cy - height / 2, width, height);
  return true;
};
