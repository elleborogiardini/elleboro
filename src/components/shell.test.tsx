import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/clienti/abc/note",
}));

import { Shell } from "@/components/shell";

describe("cornice dell'app", () => {
  it("il tecnico nel fascicolo ha l'indietro interno e non il sito né l'agenda", () => {
    const html = renderToStaticMarkup(
      <Shell role="technician">
        <p>Fascicolo</p>
      </Shell>,
    );
    expect(html).toContain('href="/app/clienti/abc"');
    expect(html).toContain("Indietro");
    expect(html).toContain("Clienti");
    expect(html).toContain("Richieste");
    expect(html).toContain("Sito");
    expect(html).not.toContain("Agenda");
    expect(html).not.toContain("Richiedi un sopralluogo");
    expect(html).not.toContain("Salva il contatto");
  });
});
