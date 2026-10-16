import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  sourcemap: true,
  // Tout est embarqué : l'image runtime n'a besoin d'aucun node_modules.
  noExternal: [/.*/],
  // yaml est publié en CJS : on fournit un `require` au bundle ESM.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
});
