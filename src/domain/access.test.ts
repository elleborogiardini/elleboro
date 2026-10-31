import { describe, expect, it } from "vitest";
import { canRead } from "@/domain/access";

const ownerOnly = [
  "preferences",
  "client_private",
  "note_sections",
  "appointments",
] as const;

const shared = [
  "clients",
  "places",
  "photos",
  "interventions",
  "inquiries",
  "site_content",
  "testimonials",
] as const;

describe("chi puo leggere", () => {
  it("l'anonimo non legge clienti, note, preferenze e appuntamenti", () => {
    expect(canRead("anon", "clients")).toBe(false);
    expect(canRead("anon", "note_sections")).toBe(false);
    expect(canRead("anon", "preferences")).toBe(false);
    expect(canRead("anon", "client_private")).toBe(false);
    expect(canRead("anon", "appointments")).toBe(false);
    expect(canRead("anon", "inquiries")).toBe(false);
    expect(canRead("anon", "photos")).toBe(false);
  });

  it("il tecnico non legge preferenze, specifiche, note e appuntamenti", () => {
    for (const resource of ownerOnly) {
      expect(canRead("technician", resource)).toBe(false);
    }
  });

  it("il proprietario legge preferenze, specifiche, note e appuntamenti", () => {
    for (const resource of ownerOnly) {
      expect(canRead("owner", resource)).toBe(true);
    }
  });

  it("tecnico e proprietario leggono anagrafica, luoghi, foto, interventi e richieste", () => {
    for (const role of ["technician", "owner"] as const) {
      for (const resource of shared) {
        expect(canRead(role, resource)).toBe(true);
      }
    }
  });

  it("l'anonimo puo leggere solo il sito pubblicato e il portfolio", () => {
    expect(canRead("anon", "public_site")).toBe(true);
    expect(canRead("anon", "public_portfolio")).toBe(true);
    expect(canRead("anon", "testimonials_public")).toBe(true);
  });
});
