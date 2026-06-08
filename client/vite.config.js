import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
        "favicon-16x16.png",
        "favicon-32x32.png",
      ],
      manifest: {
        name: "To-Do Chat",
        short_name: "To-Do Chat",
        description: "Чат для работы над проектом",
        theme_color: "#ffffff",
        background_color: "#f1f5f9",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "/favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/favicon.ico",
            sizes: "48x48",
            type: "image/x-icon",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        
        // Продакшен
        // runtimeCaching: [
        //   {
        //     urlPattern: /^https:\/\/todo\.ecomsys\.ru\/socket\.io\/.*/i,
        //     handler: "NetworkOnly",
        //   },
        // ],

        // деврежим
        runtimeCaching: [
          {
            urlPattern: /\/socket\.io\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/uploads\/.*/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/download\/.*/i, // ← ДОБАВИТЬ ЭТО!
            handler: "NetworkOnly",
          },
        ],       
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:5001",
      "/upload": "http://localhost:5001",
      "/clear-uploads": "http://localhost:5001", // ← ДОБАВИТЬ
      "/uploads": "http://localhost:5001", // ← на всякий случай
      "/download": "http://localhost:5001",
      "/socket.io": { target: "http://localhost:5001", ws: true },
    },
  },
  build: {
    outDir: "./dist",
    emptyOutDir: true,
  },
});
