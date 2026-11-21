import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/clienti/abc/note",
}));

import { Shell } from "@/components/shell";

describe("cornice dell'app", () => {
  it("il tecnico nel fascicolo ha l'indietro interno e non il sito né l'agenda", () => {
    const html = renderToStaticMarkup(
      <Shell role="technician">
        <p>Fascicolo</p>
      </Shell>,
    );
    expect(html).toContain('href="/app/clienti/abc"');
    expect(html).toContain("Indietro");
    expect(html).toContain("Clienti");
    expect(html).toContain("Richieste");
    expect(html).toContain("Sito");
    expect(html).not.toContain("Agenda");
    expect(html).not.toContain("Richiedi un sopralluogo");
    expect(html).not.toContain("Salva il contatto");
    expect(html).not.toContain("botanica");
  });

  it("la barra resta segnata nel punto premuto", () => {
    const source = readFileSync("src/components/shell.tsx", "utf8");
    expect(source).toContain("onPointerDown");
    expect(source).toContain("is-pressed");
    const css = readFileSync("src/app/globals.css", "utf8");
    const press = css.slice(
      css.indexOf(".app-tabbar a:active"),
      css.indexOf("}", css.indexOf(".app-tabbar a:active")),
    );
    expect(press).toContain("background: var(--forest)");
    expect(press).toContain("color: var(--on-forest)");
  });

  it("il proprietario vede una sola tavola nel titolo", () => {
    const html = renderToStaticMarkup(
      <Shell role="owner">
        <p>Fascicolo</p>
      </Shell>,
    );
    expect(html).toContain("app-plate");
    expect(html).toContain("botanica-ramo");
    expect(html.match(/data-botanica/g)).toHaveLength(1);
  });
});
