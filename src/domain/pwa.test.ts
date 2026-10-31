import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { installTarget, launchColors, shouldCacheAsset } from "@/domain/pwa";

describe("app installata", () => {
  it("parte dal gestionale a schermo intero, senza chrome del browser", () => {
    expect(installTarget()).toEqual({
      name: "Elleboro",
      startUrl: "/app",
      display: "standalone",
    });
  });

  it("il colore di avvio segue il fondo, anche quando il telefono è scuro", () => {
    expect(launchColors()).toEqual({ light: "#f3f8f4", dark: "#0f1911" });
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    const manifest = readFileSync("src/app/manifest.ts", "utf8");
    expect(layout).toContain("launchColors");
    expect(layout).toContain("prefers-color-scheme: dark");
    expect(manifest).toContain("launchColors");
    expect(manifest).not.toContain("#f3f6f3");
    expect(layout).not.toContain("#f3f6f3");
  });

  it("il rimbalzo della cornice non scopre il fondo del browser", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const start = css.indexOf("html:has(.app-shell)");
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toContain("html:has(.app-shell) body");
    expect(block).toContain("overscroll-behavior: none");
    expect(css).not.toMatch(/^html\s*\{[^}]*overscroll-behavior/m);
  });

  it("il tap non lascia l'alone grigio su tutta la cornice", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const html = css.slice(css.indexOf("html {"), css.indexOf("}", css.indexOf("html {")));
    expect(html).toContain("-webkit-tap-highlight-color: transparent");
  });

  it("il tab accanto al nome mostra il fiore, non la scritta del marchio", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain('icon: "/icons/tab.png"');
    expect(layout).not.toContain('icon: "/icons/icon-192.png"');
  });

  it("su iPhone il meta capace resta quello che toglie la barra di Safari", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain("apple-mobile-web-app-capable");
    expect(layout).toContain("black-translucent");
  });

  it("come aggiungerla alla Home sta nel README, una volta, non in un banner", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("Condividi");
    expect(readme).toContain("Aggiungi a Home");
    expect(readme).toContain("Aggiungi a schermata Home");
    expect(readme.match(/Aggiungi a Home/g)).toHaveLength(1);
    const shell = readFileSync("src/components/shell.tsx", "utf8");
    expect(shell).not.toContain("Aggiungi a Home");
    expect(shell).not.toContain("installa l'app");
  });

  it("tiene in cache solo asset con hash e le icone, mai le pagine dei clienti", () => {
    expect(shouldCacheAsset("navigate", "/app/clienti/1")).toBe(false);
    expect(shouldCacheAsset("navigate", "/")).toBe(false);
    expect(shouldCacheAsset("cors", "/app")).toBe(false);
    expect(shouldCacheAsset("no-cors", "/brand/logo.jpg")).toBe(false);
    expect(shouldCacheAsset("no-cors", "/_next/static/chunks/app-abc.js")).toBe(true);
    expect(shouldCacheAsset("no-cors", "/icons/icon-192.png")).toBe(true);
    const worker = readFileSync("public/sw.js", "utf8");
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).not.toContain("/brand/logo.jpg");
    expect(worker).not.toContain("cache.addAll(['/app']");
  });

  it("gli asset con hash restano in cache dopo la prima lettura", () => {
    expect(shouldCacheAsset("no-cors", "/_next/static/chunks/app-abc.js")).toBe(true);
    const worker = readFileSync("public/sw.js", "utf8");
    const branch = worker.slice(worker.indexOf('pathname.startsWith("/_next/static/")'));
    expect(branch).toContain("cache.put");
    expect(branch).toContain("response.ok");
    expect(branch).not.toContain("/app/clienti");
  });

  it("senza rete risponde con una frase chiara e non salva la pagina", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    const start = worker.indexOf('if (event.request.mode === "navigate")');
    const branch = worker.slice(start, worker.indexOf("pathname.startsWith", start));
    expect(branch).toContain("respondWith");
    expect(branch).toContain('fetch(event.request.url, { cache: "no-store"');
    expect(branch).toContain("fetch(event.request)");
    expect(branch).not.toContain("fetch(event.request,");
    expect(branch).toContain("Senza rete i dati non si aggiornano.");
    expect(branch).not.toContain("caches");
  });

  it("una navigazione non ricostruisce la richiesta e un invio ne conserva il corpo", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    const start = worker.indexOf('if (event.request.mode === "navigate")');
    const branch = worker.slice(start, worker.indexOf("pathname.startsWith", start));
    expect(branch).not.toContain("new Request(");
    expect(branch).toContain('event.request.method === "GET"');
    expect(branch).toContain(
      'fetch(event.request.url, { cache: "no-store", credentials: "same-origin" })',
    );
    expect(branch).toContain("fetch(event.request)");
    expect(branch).toContain("Senza rete i dati non si aggiornano.");
    expect(branch).not.toContain("caches");
  });
});
