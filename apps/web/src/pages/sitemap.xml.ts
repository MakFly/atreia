import type { APIRoute } from "astro";
import { allGuides, guideHref } from "@/lib/guides";

export const prerender = false;

const STATIC_PATHS = ["/", "/fr/", "/guides/", "/fr/guides/", "/classes/", "/fr/classes/", "/actualites/", "/fr/actualites/", "/serveurs/", "/fr/serveurs/"];

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("SITE_URL manquant pour le sitemap");
  const editions = await Promise.all((["en", "fr"] as const).map(async (locale) => {
    const guides = await allGuides(locale);
    return guides.map((guide) => ({
      loc: new URL(guideHref(guide.slug, locale), site).href,
      lastmod: guide.updated,
    }));
  }));
  const urls = [
    ...STATIC_PATHS.map((path) => ({ loc: new URL(path, site).href })),
    ...editions.flat(),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeXml(url.loc)}</loc>${"lastmod" in url ? `<lastmod>${url.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
