import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InquiryForm, InquiryReceived } from "@/components/inquiry-form";

describe("modulo richiesta", () => {
  it("il campo anti-spam non ha un'etichetta da compilare", () => {
    const html = renderToStaticMarkup(<InquiryForm />);
    expect(html).toContain('name="company"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("Azienda");
  });

  it("tipo di luogo e bisogno si inviano anche senza javascript", () => {
    const html = renderToStaticMarkup(<InquiryForm />);
    const radios = html.match(/<input[^>]*>/g) ?? [];
    const marked = (name: string, value: string) =>
      radios.some(
        (tag) =>
          tag.includes('type="radio"') &&
          tag.includes(`name="${name}"`) &&
          tag.includes(`value="${value}"`),
      );
    expect(marked("place_kind", "balcone")).toBe(true);
    expect(marked("need", "progetto")).toBe(true);
    expect(html).not.toContain('type="hidden" name="place_kind"');
    expect(html).not.toContain('type="hidden" name="need"');
  });

  it("la scelta resta visibile quando si arriva da tastiera", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const start = css.indexOf(".choice label:has(input:focus-visible)");
    expect(start).toBeGreaterThan(-1);
    const rule = css.slice(start, css.indexOf("}", start));
    expect(rule).toContain("outline");
    expect(rule).toContain("var(--gold)");
  });

  it("la conferma sostituisce il modulo in dissolvenza", () => {
    const html = renderToStaticMarkup(<InquiryReceived />);
    expect(html).toContain("Ho ricevuto la richiesta. Ti ricontatto io.");
    expect(html).toContain("action-notice");
    expect(html).not.toContain("name=\"message\"");
  });
});
