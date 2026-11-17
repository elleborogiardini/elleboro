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
  });
});
