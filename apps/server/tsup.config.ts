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
  external: ["node:sqlite"],
  // tsup retire le préfixe node: par défaut ; `sqlite` seul n'existe pas.
  removeNodeProtocol: false,
  // yaml est publié en CJS : on fournit un `require` au bundle ESM.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
});
