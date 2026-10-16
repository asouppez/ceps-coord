import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// La configuration de Tailwind est ici : pas d'autre fichier à ajouter.
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ content: ["./index.html", "./src/**/*.{js,jsx}"] }),
        autoprefixer(),
      ],
    },
  },
});
