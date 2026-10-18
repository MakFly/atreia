import { createMarkdownProcessor, type MarkdownHeading } from "@astrojs/markdown-remark";
import rehypeImages from "./rehype-images";
import type { Locale } from "./i18n";

let renderer: ReturnType<typeof createMarkdownProcessor> | undefined;

function processor() {
  renderer ??= createMarkdownProcessor({ rehypePlugins: [rehypeImages] });
  return renderer;
}

/** Render a guide body with the same image and heading pipeline as the rest of the site. */
export async function renderGuideMarkdown(body: string, locale: Locale, slug: string): Promise<{ html: string; headings: MarkdownHeading[] }> {
  const render = await processor();
  const path = locale === "en" ? `/guides/en/${slug}.md` : `/guides/${slug}.md`;
  const result = await render.render(body, { fileURL: new URL(path, "file://") });
  return { html: result.code, headings: result.metadata.headings };
}
