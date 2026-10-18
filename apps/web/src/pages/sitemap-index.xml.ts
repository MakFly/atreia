import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("SITE_URL manquant pour le sitemap");
  const loc = new URL("/sitemap.xml", site).href;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${loc.replaceAll("&", "&amp;")}</loc></sitemap>
</sitemapindex>
`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
