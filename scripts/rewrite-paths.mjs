// Réécrit uniquement les chemins à la racine du site, sans toucher aux URL externes.
function rewritePath(value, prefix) {
  if (!value.startsWith("/") || value.startsWith("//")) return value;
  const [, path, suffix] = value.slice(1).match(/^([^?#]*)(.*)$/s);
  const target = path === "" || path.endsWith("/") ? `${path}index.html` : path;
  return `${prefix}${target}${suffix}`;
}

function rewriteSrcset(value, prefix) {
  // Les URL data: contiennent des virgules qui ne séparent pas les candidats.
  let result = "";
  let cursor = 0;
  while (cursor < value.length) {
    const separators = value.slice(cursor).match(/^[\s,]*/)[0];
    result += separators;
    cursor += separators.length;
    const token = value.slice(cursor).match(/^\S+/)?.[0];
    if (!token) break;
    const url = token.replace(/,+$/, "");
    result += (url.startsWith("data:")
      ? url
      : url.split(",").map((candidate) => rewritePath(candidate, prefix)).join(","))
      + token.slice(url.length);
    cursor += token.length;
    if (token.endsWith(",")) continue;
    // Les descripteurs (1x, 2x, 640w...) restent inchangés.
    const end = value.indexOf(",", cursor);
    const next = end === -1 ? value.length : end;
    result += value.slice(cursor, next);
    cursor = next;
  }
  return result;
}

export function rewriteHtmlPaths(html, prefix) {
  return html.replace(
    /(\s)(href|src|srcset|content|component-url|renderer-url|before-hydration-url)=(['"])(.*?)\3/gs,
    (_match, space, attr, quote, value) => {
      const rewritten = attr === "srcset"
        ? rewriteSrcset(value, prefix)
        : rewritePath(value, prefix);
      return `${space}${attr}=${quote}${rewritten}${quote}`;
    },
  ).replace('data-root="/" data-index=""', `data-root="${prefix}" data-index="index.html"`);
}
