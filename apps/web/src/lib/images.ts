// Dimensions des images de public/images (sources et licences : public/images/manifest.json).
// Chaque JPEG a une variante WebP de même nom (1600 px max) : <Picture> sert la WebP, le JPEG reste pour Open Graph.
const SIZES: Record<string, [number, number]> = {
  "steam-background.jpg": [1438, 810],
  "official-halloween-2026-costumes.jpg": [1280, 545],
  "official-halloween-2026-masks.jpg": [1280, 545],
  "official-fire-temple.jpg": [1280, 720],
  "official-shattered-arkanis.jpg": [1280, 720],
  "official-winged-creature-platform.jpg": [1280, 720],
  "official-class-lineup.jpg": [1280, 720],
  "official-founders-packs.jpg": [1280, 720],
  "official-red-canopy-landscape.jpg": [1280, 720],
  "official-class-templar.jpg": [1280, 720],
  "official-class-cleric.jpg": [1280, 720],
  "official-combat-water.jpg": [1280, 720],
  "official-two-daevas-cave.jpg": [1280, 720],
  "official-white-wings-islands.jpg": [1280, 720],
  "official-purple-magic-hall.jpg": [1280, 720],
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
export const DEFAULT_SHARE_IMAGE = "/images/steam-background.jpg";
