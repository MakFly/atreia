import { expect, test } from "bun:test";
import { rewriteHtmlPaths } from "./rewrite-paths.mjs";

test("réécrit les chemins et conserve les ancres et paramètres", () => {
  expect(rewriteHtmlPaths('<a href="/guides/?tri=date#suite"><img src="/images/x.webp"></a>', "../../"))
    .toBe('<a href="../../guides/index.html?tri=date#suite"><img src="../../images/x.webp"></a>');
});

test("réécrit les sources WebP et les candidats avec descripteurs", () => {
  expect(rewriteHtmlPaths('<source srcset="/images/x.webp,/images/y.webp"><img srcset="/images/x.webp 1x, /images/x@2.webp 2x, /images/large.webp 1200w">', "./"))
    .toBe('<source srcset="./images/x.webp,./images/y.webp"><img srcset="./images/x.webp 1x, ./images/x@2.webp 2x, ./images/large.webp 1200w">');
});

test("préserve les URL externes, data et relatives dans les attributs et srcset", () => {
  const html = '<a href="//cdn.example/x"><img src="https://example.com/x" srcset="data:image/png;base64,AAAA 1x, //cdn.example/x 2x, images/local.webp 3x, /images/x.webp 4x"></a>';
  expect(rewriteHtmlPaths(html, "../"))
    .toBe(html.replace('/images/x.webp 4x', '../images/x.webp 4x'));
});

test("réécrit content, les îlots Astro et la racine de navigation", () => {
  expect(rewriteHtmlPaths('<html data-root="/" data-index=""><meta content=\'/images/share.webp\'><astro-island component-url="/assets/a.js" renderer-url="/assets/r.js" before-hydration-url="/assets/h.js">', "../"))
    .toBe('<html data-root="../" data-index="index.html"><meta content=\'../images/share.webp\'><astro-island component-url="../assets/a.js" renderer-url="../assets/r.js" before-hydration-url="../assets/h.js">');
});
