import path from "node:path";
import { readdirSync, statSync } from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

/** Files in public/ that the offline cache should hold (skips licence texts). */
function publicFiles(dir: string, base = ""): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name),
      rel = `${base}/${name}`;
    if (statSync(full).isDirectory()) return publicFiles(full, rel);
    return /\.(txt|md)$/i.test(name) ? [] : [rel];
  });
}

/**
 * Emits sw.js with every built file listed, so the whole app (including lazily
 * loaded sections and fonts) works offline after the first visit.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: "pichirlash-offline-sw",
    apply: "build",
    generateBundle(_, bundle) {
      const files = [
        "/",
        ...Object.keys(bundle).map((f) => `/${f}`),
        ...publicFiles(path.resolve(import.meta.dirname, "public")),
      ].filter((f) => !f.endsWith(".map"));
      const version = Date.now().toString(36);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `/* Generated at build time. */
const CACHE = "pichirlash-${version}";
const FILES = ${JSON.stringify([...new Set(files)])};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pichirlash-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/", { cacheName: CACHE, ignoreVary: true })));
    return;
  }
  event.respondWith(
    caches.match(request, { cacheName: CACHE, ignoreVary: true }).then((hit) => hit || fetch(request)),
  );
});
`,
      });
    },
  };
}

export default defineConfig({
  server: { allowedHosts: ["terminal.local"] },
  plugins: [react(), tailwindcss(), offlineServiceWorker()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
