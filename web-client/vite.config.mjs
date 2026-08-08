import { defineConfig } from "vite";
import { ember } from "@nullvoxpopuli/ember-vite";
import { scopedCSS } from "ember-scoped-css/vite";

export default defineConfig({
  plugins: [scopedCSS(), ember()],
  server: {
    port: 5002,
    allowedHosts: ['app.nvp.local', '.nvp.local'],
  },
});
