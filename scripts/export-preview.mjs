// Export de l'aperçu statique : réécrit les chemins absolus en chemins relatifs
// pour un hébergement sous un sous-chemin inconnu (aperçu, stockage objet sans réécriture d'URL).
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "apps/web/dist");
const out = join(root, "apps/web/dist-preview");

await rm(out, { recursive: true, force: true });
await cp(src, out, { recursive: true });

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const ATTR = /\b(href|src|component-url|renderer-url|before-hydration-url)="\/([^"]*)"/g;

for await (const file of walk(out)) {
  const rel = relative(dirname(file), out).split(sep).join("/");
  const prefix = rel === "" ? "./" : `${rel}/`;
  if (file.endsWith(".html")) {
    let html = await readFile(file, "utf8");
    html = html.replace(ATTR, (_m, attr, path) => {
      const [p, hash = ""] = path.split("#");
      const target = p === "" || p.endsWith("/") ? `${p}index.html` : p;
      return `${attr}="${prefix}${target}${hash ? `#${hash}` : ""}"`;
    });
    html = html.replace('data-root="/" data-index=""', `data-root="${prefix}" data-index="index.html"`);
    await writeFile(file, html);
  } else if (file.endsWith(".css")) {
    // Les CSS sont dans assets/ : url(/assets/x) devient url(x).
    const css = (await readFile(file, "utf8")).replaceAll("url(/assets/", "url(");
    await writeFile(file, css);
  }
}
console.log(`Aperçu exporté dans ${relative(root, out)}`);
