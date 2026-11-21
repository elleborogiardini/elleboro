import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("tocco sul calendario", () => {
  it("il giorno cambia subito, senza ricaricare la pagina", () => {
    const source = readFileSync("src/components/agenda-board.tsx", "utf8");
    expect(source).toContain("useState");
    expect(source).toContain('type="button"');
    expect(source).toContain("agenda-week");
    expect(source).not.toContain("<Link");
    expect(source).not.toContain("href=");
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    expect(page).toContain("<AgendaBoard");
    expect(page).not.toContain("agendaHref");
  });

  it("il dito vede subito il punto premuto", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const day = css.slice(css.indexOf(".agenda-day:active"), css.indexOf("}", css.indexOf(".agenda-day:active")));
    expect(day).toContain("background: var(--forest)");
    expect(css).toContain(".app-shell a:active");
    expect(css).toContain(".app-shell button:active");
  });
});
