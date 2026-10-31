import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("richieste", () => {
  it("un aggiornamento rifiutato resta visibile sulla richiesta", () => {
    const source = readFileSync(resolve("src/server/actions.ts"), "utf8");
    const start = source.indexOf("export async function setInquiryStatusAction");
    const body = source.slice(start, source.indexOf("\nexport async function", start + 10));
    expect(body).toContain("bail(formData,");
    expect(body).toContain("Non sono riuscito ad aggiornare la richiesta.");
  });
});
