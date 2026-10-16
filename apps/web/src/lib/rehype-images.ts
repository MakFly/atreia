import type { Element, Root } from "hast";
import { imageSize, webpOf } from "./images";

/** Images des guides : mêmes dimensions et variantes WebP que le composant Picture. */
export default function rehypeImages() {
  return (tree: Root) => {
    function walk(parent: Root | Element) {
      for (let index = 0; index < parent.children.length; index++) {
        const node = parent.children[index];
        if (node?.type !== "element") continue;

        const src = node.properties.src;
        if (node.tagName === "img" && typeof src === "string" && src.startsWith("/images/")) {
          Object.assign(node.properties, imageSize(src), { loading: "lazy", decoding: "async" });
          parent.children[index] = {
            type: "element",
            tagName: "picture",
            properties: {},
            children: [
              { type: "element", tagName: "source", properties: { type: "image/webp", srcSet: webpOf(src) }, children: [] },
              node,
            ],
          };
        } else {
          walk(node);
        }
      }
    }

    walk(tree);
  };
}
