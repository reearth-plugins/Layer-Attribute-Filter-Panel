import path from "path";

import fg from "fast-glob";
import { defineConfig } from "vite";

const extensionName = process.env.EXTENSION_NAME || "";

export default defineConfig({
  plugins: [
    {
      name: "watch-external",
      async buildStart() {
        const files = await fg(["public/**/*"]);
        for (const file of files) {
          this.addWatchFile(file);
        }
      },
    },
  ],
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: false,
    lib: {
      formats: ["iife"],
      entry: path.resolve(
        __dirname,
        "../src/extensions",
        extensionName,
        `${extensionName}.ts`,
      ),
      // IIFE global name must be a legal JS identifier, so sanitize the
      // extension name (which may contain hyphens, e.g. "layer-filter-widget").
      name: extensionName.replace(/[^a-zA-Z0-9_$]/g, "_"),
      fileName: () => `${extensionName}.js`,
    },
  },
  resolve: {
    alias: {
      "@distui": path.resolve(__dirname, "../dist-ui"),
    },
  },
});
