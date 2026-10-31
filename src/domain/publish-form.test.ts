import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("pubblicazione foto", () => {
  it("un errore torna nel fascicolo, non all'elenco", () => {
    const source = readFileSync(resolve("src/app/app/clienti/[id]/page.tsx"), "utf8");
    const start = source.indexOf("<form action={publishPhotoAction}");
    const form = source.slice(start, source.indexOf("</form>", start));
    expect(form).toContain('name="client_id"');
    expect(form).toContain('name="return_to"');
    expect(form).toContain("/app/clienti/${id}");
  });
});
