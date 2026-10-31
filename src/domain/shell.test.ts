import { describe, expect, it } from "vitest";
import { ownerDossierLinks, safeReturn, shellChrome, tabCurrent, tabsFor } from "@/domain/shell";

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

  it("nel fascicolo resta segnata la voce Clienti", () => {
    expect(tabCurrent("/app", "/app/clienti/abc/note")).toBe(true);
    expect(tabCurrent("/app", "/app")).toBe(true);
    expect(tabCurrent("/app", "/app/agenda")).toBe(false);
    expect(tabCurrent("/app/richieste", "/app/richieste/abc")).toBe(true);
    expect(tabCurrent("/app/sito", "/app")).toBe(false);
  });
});
