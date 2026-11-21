import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Botanica, Filo } from "@/components/botanica";

describe("tavole botaniche", () => {
  it("la tavola è decorativa e usa la maschera della pianta scelta", () => {
    const html = renderToStaticMarkup(<Botanica plant="ramo" className="hero-botanica" />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("botanica-ramo");
    expect(html).toContain("hero-botanica");
    expect(html).not.toContain("<img");
  });

  it("il filo tra le sezioni è decorativo e porta un fiore al centro", () => {
    const html = renderToStaticMarkup(<Filo />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("botanica-fiore");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/\.services-botanica \{\s*display: none;/);
    expect(css).toMatch(/\.filo \{[^}]*background: transparent;/);
    expect(css).toMatch(/\.filo \{[^}]*z-index: 1;/);
    expect(css).toMatch(/\.filo \{[^}]*margin-block: calc\(2\.15rem \* 885 \/ 640 \/ -2\);/);
    expect(css).toMatch(/\.filo-fiore \{[^}]*translate: 0 0;/);
    expect(readFileSync("src/app/app/page.tsx", "utf8")).toContain('className="client-search"');
  });
});
