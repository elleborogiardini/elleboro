import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { openingMotion, screenMotion } from "@/domain/motion";

describe("movimento", () => {
  it("il passaggio dal sito alla richiesta è una salita breve e resta cliccabile", () => {
    expect(screenMotion("/richiesta", false)).toEqual({
      y: 16,
      duration: 0.4,
      opacity: 1,
    });
  });

  it("nel gestionale i tab sfumano e una scheda entra di lato", () => {
    expect(screenMotion("/app", false)).toEqual({ opacity: 0.92, duration: 0.18 });
    expect(screenMotion("/app/clienti/abc", false)).toEqual({
      x: 28,
      duration: 0.22,
      opacity: 1,
    });
    expect(screenMotion("/app/richieste/abc", false).duration).toBe(0.22);
  });

  it("la pressione del numero e dei bottoni scala appena", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const press = css.slice(css.indexOf(".btn:active"), css.indexOf("}", css.indexOf(".btn:active")));
    expect(press).toContain(".hero-phone:active");
    expect(press).toContain(".phone-dock:active");
    expect(press).toContain("scale(0.98)");
    const calm = css.slice(css.indexOf("prefers-reduced-motion: reduce"));
    expect(calm).toContain(".hero-phone:active");
    expect(calm).toContain(".phone-dock:active");
    expect(calm).toContain("transform: none");
  });

  it("lo scorrimento muove il ritratto e con meno movimento resta fermo", () => {
    const source = readFileSync("src/components/site-motion.tsx", "utf8");
    expect(source).toContain("ScrollTrigger");
    expect(source).toContain("prefers-reduced-motion: no-preference");
    expect(source).not.toContain("opacity: 0");
  });

  it("il marchio si assesta sulla lastra, senza sparire e senza una seconda cornice", () => {
    const source = readFileSync("src/components/site-motion.tsx", "utf8");
    const settle = source.slice(source.indexOf("[data-mark]"), source.indexOf("[data-rise]"));
    expect(settle).toContain("scale: 0.94");
    expect(settle).toContain("blur(8px)");
    expect(settle).not.toContain("opacity");
    const logo = readFileSync("src/components/brand/Logo.tsx", "utf8");
    expect(logo).toContain("data-mark");
    expect(logo).toContain("logo-plate");
    expect(logo).not.toContain("logo-mat");
    expect(logo).not.toContain("logo-marks");
    const css = readFileSync("src/app/globals.css", "utf8");
    const plate = css.slice(css.indexOf(".logo-plate"), css.indexOf(".logo-image"));
    expect(plate).toContain("var(--gold)");
    expect(css).not.toContain(".logo-mat");
    expect(css).not.toContain(".logo-marks");
  });

  it("l'apertura del sito dura circa 700 ms e con meno movimento è immediata", () => {
    expect(openingMotion(false)).toEqual({ y: 16, duration: 0.7, opacity: 1 });
    expect(screenMotion("/", true)).toEqual({ instant: true });
    expect(openingMotion(true)).toEqual({ instant: true });
  });
});
