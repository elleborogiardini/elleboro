import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ownerDossierLinks, ownerPlate, safeReturn, shellChrome, tabCurrent, tabsFor } from "@/domain/shell";

describe("app installata", () => {
  it("il tecnico non vede l'agenda", () => {
    const labels = tabsFor("technician").map((tab) => tab.label);
    expect(labels).toEqual(["Clienti", "Richieste", "Sito"]);
    expect(labels).not.toContain("Agenda");
  });

  it("il proprietario vede le quattro voci e l'icona apre il gestionale", () => {
    expect(tabsFor("owner").map((tab) => tab.label)).toEqual([
      "Clienti",
      "Agenda",
      "Richieste",
      "Sito",
    ]);
  });

  it("nelle schede l'indietro resta nel gestionale e non apre il sito", () => {
    expect(shellChrome("/app")).toEqual({ title: "Clienti", back: null });
    expect(shellChrome("/app/agenda")).toEqual({ title: "Agenda", back: null });
    expect(shellChrome("/app/clienti/abc")).toEqual({ title: "Fascicolo", back: "/app" });
    expect(shellChrome("/app/clienti/abc/note")).toEqual({
      title: "Note",
      back: "/app/clienti/abc",
    });
    expect(shellChrome("/app/clienti/abc/preferenze")).toEqual({
      title: "Preferenze",
      back: "/app/clienti/abc",
    });
    expect(shellChrome("/app/richieste/abc")).toEqual({ title: "Richieste", back: "/app/richieste" });
    expect(shellChrome("/app/sito").back).toBeNull();
    expect(shellChrome("/app/accesso")).toEqual({ title: "Accesso", back: "/app" });
  });

  it("il tecnico non vede i collegamenti a preferenze e note", () => {
    expect(ownerDossierLinks("technician", "abc")).toEqual([]);
    expect(ownerDossierLinks("owner", "abc")).toEqual([
      { href: "/app/clienti/abc/preferenze", label: "Preferenze e specifiche" },
      { href: "/app/clienti/abc/note", label: "Note" },
    ]);
  });

  it("un errore di salvataggio torna solo dentro il gestionale", () => {
    expect(safeReturn("/app/clienti/abc/note")).toBe("/app/clienti/abc/note");
    expect(safeReturn("/app")).toBe("/app");
    expect(safeReturn("https://esempio.test")).toBeNull();
    expect(safeReturn("//esempio.test")).toBeNull();
    expect(safeReturn("/app/../.env")).toBeNull();
    expect(safeReturn("/richiesta")).toBeNull();
  });

  it("il proprietario ha una tavola per schermata e le sezioni cambiano fondo", () => {
    expect(ownerPlate("/app")).toBe("fiore");
    expect(ownerPlate("/app/clienti/abc")).toBe("fiore");
    expect(ownerPlate("/app/agenda")).toBe("ramo");
    expect(ownerPlate("/app/richieste")).toBe("bordura");
    expect(ownerPlate("/app/richieste/abc")).toBe("bordura");
    expect(ownerPlate("/app/sito")).toBe("mazzo");
    expect(ownerPlate("/app/clienti/abc/note")).toBe("ramo");
    expect(ownerPlate("/app/clienti/abc/preferenze")).toBe("fiore");
    expect(ownerPlate("/app/accesso")).toBe("mazzo");

    const paired = [
      "src/app/app/page.tsx",
      "src/app/app/agenda/page.tsx",
      "src/app/app/clienti/[id]/page.tsx",
      "src/app/app/clienti/[id]/note/page.tsx",
      "src/app/app/clienti/[id]/preferenze/page.tsx",
      "src/app/app/richieste/[id]/page.tsx",
      "src/app/app/sito/page.tsx",
      "src/app/app/accesso/page.tsx",
    ];
    for (const file of paired) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("owner-section");
      expect(source, file).toContain("is-grove");
    }
    expect(readFileSync("src/app/app/richieste/page.tsx", "utf8")).toContain("owner-section");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/\.owner-section \{[^}]*background: var\(--surface\);/);
    expect(css).toMatch(/\.owner-section\.is-grove \{[^}]*background: var\(--grove\);/);
    expect(css).toMatch(/\.app-plate \{[^}]*color: var\(--herb\);/);
  });

  it("nel fascicolo resta segnata la voce Clienti", () => {
    expect(tabCurrent("/app", "/app/clienti/abc/note")).toBe(true);
    expect(tabCurrent("/app", "/app")).toBe(true);
    expect(tabCurrent("/app", "/app/agenda")).toBe(false);
    expect(tabCurrent("/app/richieste", "/app/richieste/abc")).toBe(true);
    expect(tabCurrent("/app/sito", "/app")).toBe(false);
  });
});
