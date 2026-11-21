import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CopyFeedLink } from "@/components/copy-feed-link";

describe("copia del calendario", () => {
  it("il pulsante copia l'indirizzo senza mostrarlo", () => {
    const html = renderToStaticMarkup(
      <CopyFeedLink url="https://example.test/feed/segreto" />,
    );
    expect(html).toContain("Copia indirizzo");
    expect(html).toContain('type="button"');
    expect(html).not.toContain("segreto");
    expect(html).not.toContain("example.test");

    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    const block = page.slice(page.indexOf("Anche sul tuo calendario"));
    expect(block).toContain("<CopyFeedLink url={feedUrl} />");
    expect(block).toContain("Aggiungi calendario da abbonamento");
    expect(block).toContain("Android");
    expect(block).toContain("calendar.google.com");
    expect(block).toContain("Nuovo abbonamento calendario");
    expect(block).toContain("Da URL");
    expect(block).not.toContain(">{feedUrl}<");
    expect(block).not.toContain("break-all");
    expect(page).not.toContain("In Google Calendar scegli Da URL. Nel Calendario Apple, Iscriviti.");
    expect(page).toContain('className="owner-section is-grove"');
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/\.owner-section\.is-grove \{[^}]*background: var\(--grove\);/);
  });
});
