import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Univer expects this deep path which opentype.js 1.3.5 ships as opentype.mjs
      "opentype.js/dist/opentype.module.js": path.resolve(
        __dirname,
        "./node_modules/opentype.js/dist/opentype.mjs",
      ),
    },
  },
}));
