import "dotenv/config";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import astroI18next from "astro-i18next";

export default defineConfig({
  site: "https://my-assets.pages.dev",
  output: "hybrid",
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [react(), astroI18next()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});