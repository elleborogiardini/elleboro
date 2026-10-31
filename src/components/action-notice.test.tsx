import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionNotice } from "@/components/action-notice";

describe("errore di salvataggio", () => {
  it("entra in dissolvenza e non trema", () => {
    const html = renderToStaticMarkup(<ActionNotice message="La frase sta in venti parole." />);
    expect(html).toContain("action-notice");
    expect(html).not.toContain("shake");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain(".action-notice");
    expect(css).toContain("@keyframes notice-in");
    expect(css).not.toMatch(/@keyframes\s+shake/);
    const reduced = css.split("prefers-reduced-motion")[1] ?? "";
    expect(reduced).toContain(".action-notice");
  });
});
