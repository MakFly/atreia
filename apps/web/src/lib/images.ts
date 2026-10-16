// Dimensions des images de public/assets (sources et licences : public/assets/manifest.json).
// Chaque JPEG a une variante WebP de même nom (1600 px max) : <Picture> sert la WebP, le JPEG reste pour Open Graph.
const SIZES: Record<string, [number, number]> = {
  "steam-background.jpg": [1438, 810],
  "official-halloween-2026-costumes.jpg": [1280, 545],
  "trailer-launch-reveal.jpg": [1280, 720],
  "trailer-spread-your-wings.jpg": [1280, 720],
  "trailer-heirs-of-the-broken-sky.jpg": [1280, 720],
};

export function imageSize(src: string): { width: number; height: number } {
  const [width, height] = SIZES[src.split("/").pop() ?? ""] ?? [1920, 1080];
  return { width, height };
}

export const webpOf = (src: string) => src.replace(/\.(jpe?g|png)$/i, ".webp");

/** Image par défaut des partages sociaux. */
export const DEFAULT_SHARE_IMAGE = "/assets/steam-background.jpg";
