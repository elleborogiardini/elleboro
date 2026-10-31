import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { oklchContrast } from "@/domain/contrast";

function token(block: string, name: string) {
  return block.match(new RegExp(`${name}:\\s*(oklch\\([^)]+\\))`))?.[1] ?? "";
}

function cascaded(light: string, dark: string, name: string) {
  return token(dark, name) || token(light, name);
}

describe("tema scuro", () => {
  it("il bottone chiaro sul verde non segue il fondo scuro", () => {
    const css = readFileSync(resolve("src/app/globals.css"), "utf8");
    const rule = css.match(/\.btn-paper\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(rule).toContain("var(--pill)");
    expect(rule).toContain("var(--pill-ink)");
    expect(rule).not.toContain("var(--paper)");
    const dark = css.match(/@media \(prefers-color-scheme: dark\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(dark).not.toContain("--pill");
  });

  it("testo e bottone verde restano leggibili, anche l'errore sul fondo scuro", () => {
    const css = readFileSync(resolve("src/app/globals.css"), "utf8");
    const light = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
    const darkAt = css.indexOf("prefers-color-scheme: dark");
    const dark = css.slice(css.indexOf(":root {", darkAt), css.indexOf("}", css.indexOf(":root {", darkAt)));
    expect(oklchContrast(cascaded(light, "", "--on-forest"), cascaded(light, "", "--forest"))).toBeGreaterThanOrEqual(4.5);
    expect(oklchContrast(cascaded(light, dark, "--on-forest"), cascaded(light, dark, "--forest"))).toBeGreaterThanOrEqual(4.5);
    expect(oklchContrast(cascaded(light, "", "--ink"), cascaded(light, "", "--paper"))).toBeGreaterThanOrEqual(4.5);
    expect(oklchContrast(cascaded(light, dark, "--ink"), cascaded(light, dark, "--paper"))).toBeGreaterThanOrEqual(4.5);
    expect(oklchContrast(cascaded(light, dark, "--danger"), cascaded(light, dark, "--paper"))).toBeGreaterThanOrEqual(4.5);
  });
});
