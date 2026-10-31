import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { draftSite } from "@/domain/draft";
import { portraitSrc, publicBlocks, publicWorkSrc, sharePreview, siteForEditor, siteForVisitor, editorServices, workVisibility } from "@/domain/public-page";

describe("pagina pubblica", () => {
  it("senza telefono, lavori e testimonianze quelle sezioni non ci sono", () => {
    expect(publicBlocks({ works: 0, quotes: 0, phone: "  " })).toEqual({
      works: false,
      quotes: false,
      phone: false,
    });
  });

  it("con telefono, un lavoro e una testimonianza visibile le sezioni ci sono", () => {
    expect(publicBlocks({ works: 1, quotes: 2, phone: "333 000 1111" })).toEqual({
      works: true,
      quotes: true,
      phone: true,
    });
  });

  it("il link inoltrato mostra nome e attività, e il telefono solo se è pubblicato", () => {
    const quiet = sharePreview({
      ownerName: "Hasith Conthrath",
      heroTitle: "Elleboro Giardini",
      phone: "  ",
    });
    expect(quiet.title).toBe("Elleboro Giardini");
    expect(quiet.title).not.toContain("Hasith");
    expect(quiet.description).toBe("Hasith Conthrath, Elleboro Giardini.");
    expect(quiet.description).not.toMatch(/\d/);

    const calling = sharePreview({
      ownerName: "Hasith Conthrath",
      heroTitle: "Elleboro Giardini",
      phone: "333 000 1111",
    });
    expect(calling.title).toBe("Elleboro Giardini");
    expect(calling.description).toContain("Hasith Conthrath");
    expect(calling.description).toContain("333 000 1111");
    expect(calling.description).not.toMatch(/via|indirizzo/i);
  });

  it("l'editor tiene il testo anche se il sito non è pubblicato", () => {
    const hidden = siteForEditor(
      {
        ...draftSite,
        bio: "Testo vero di Hasith.",
        phone: "333 000 1111",
        published: false,
      },
      draftSite,
    );
    expect(hidden.bio).toBe("Testo vero di Hasith.");
    expect(hidden.phone).toBe("333 000 1111");
    expect(hidden.published).toBe(false);

    const missing = siteForEditor(null, draftSite);
    expect(missing.bio).toBe(draftSite.bio);
    expect(missing.published).toBe(false);
  });

  it("se il sito non è visibile il visitatore non legge la bozza", () => {
    expect(siteForVisitor(null, true, draftSite)).toBeNull();
    const published = siteForVisitor(
      { ...draftSite, bio: "Testo pubblicato.", phone: "333 000 1111" },
      true,
      draftSite,
    );
    expect(published?.bio).toBe("Testo pubblicato.");
    expect(published?.phone).toBe("333 000 1111");
    expect(siteForVisitor(null, false, draftSite)?.bio).toBe(draftSite.bio);
    const page = readFileSync("src/app/page.tsx", "utf8");
    const closed = page.slice(page.indexOf("if (!site)"), page.indexOf("const blocks"));
    expect(closed).toContain("Il sito non è ancora visibile.");
    expect(closed).not.toContain("hero-phone");
    expect(closed).not.toContain(draftSite.bio);
    const data = readFileSync("src/lib/data.ts", "utf8");
    const reader = data.slice(
      data.indexOf("export async function getPublicSite"),
      data.indexOf("export async function getEditorSite"),
    );
    expect(reader).toContain("siteForVisitor");
    const card = readFileSync("src/app/contatto/route.ts", "utf8");
    expect(card.indexOf("if (!site)")).toBeGreaterThan(-1);
    expect(card.indexOf("if (!site)")).toBeLessThan(card.indexOf("buildVcard({"));
  });

  it("il bagliore del marchio non allarga la pagina", () => {
    const page = readFileSync("src/app/page.tsx", "utf8");
    expect(page.match(/<main className="overflow-x-clip">/g)).toHaveLength(2);
  });

  it("l'editor tiene sempre i tre passi, anche se ne manca uno", () => {
    expect(
      editorServices([{ title: "Ascolto", body: "Uno" }], draftSite.services),
    ).toEqual([
      { title: "Ascolto", body: "Uno" },
      draftSite.services[1],
      draftSite.services[2],
    ]);
    expect(editorServices([], draftSite.services)).toEqual(draftSite.services);
    expect(
      editorServices(
        [
          { title: "Uno", body: "A" },
          { title: "Due", body: "B" },
          { title: "Tre", body: "C" },
          { title: "Quattro", body: "D" },
        ],
        draftSite.services,
      ),
    ).toEqual([
      { title: "Uno", body: "A" },
      { title: "Due", body: "B" },
      { title: "Tre", body: "C" },
    ]);
    const page = readFileSync("src/app/app/sito/page.tsx", "utf8");
    expect(page).toContain("editorServices");
    expect(page).not.toContain("site.services.length ? site.services");
  });

  it("il ritratto di partenza resta finché il proprietario non ne carica uno", () => {
    expect(portraitSrc(null, "http://127.0.0.1:54321")).toBe("/brand/portrait.jpg");
    expect(portraitSrc("", "http://127.0.0.1:54321")).toBe("/brand/portrait.jpg");
    expect(portraitSrc("portrait-abc.jpg", "")).toBe("/brand/portrait.jpg");
    expect(portraitSrc("portrait-abc.jpg", "http://127.0.0.1:54321")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/portfolio/portrait-abc.jpg",
    );
    expect(portraitSrc("../private/segreto.jpg", "http://127.0.0.1:54321")).toBe(
      "/brand/portrait.jpg",
    );
    expect(portraitSrc("portrait-abc.jpg/../segreto.jpg", "http://127.0.0.1:54321")).toBe(
      "/brand/portrait.jpg",
    );
  });

  it("una foto pubblicata non esce dalla cartella pubblica", () => {
    expect(publicWorkSrc("lavoro.jpg", "http://127.0.0.1:54321")).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/portfolio/lavoro.jpg",
    );
    expect(publicWorkSrc("../private/segreto.jpg", "http://127.0.0.1:54321")).toBe("");
    expect(publicWorkSrc("lavoro.jpg", "")).toBe("");
  });

  it("se il puntatore del ritratto non si salva, il proprietario vede l'errore", () => {
    const source = readFileSync("src/server/actions.ts", "utf8");
    const start = source.indexOf("export async function uploadPortraitAction");
    const body = source.slice(start, source.indexOf("export async function signOutAction"));
    expect(body).toContain("Non sono riuscito a salvare il ritratto.");
    expect(body).not.toContain('from("portfolio_items")');
  });

  it("in fondo al sito c'è l'accesso verso il login, non dentro l'app", () => {
    const page = readFileSync("src/app/page.tsx", "utf8");
    expect(page).toContain('href="/login"');
    expect(page).toContain("Accesso");
    const shell = readFileSync("src/components/shell.tsx", "utf8");
    expect(shell).not.toContain('href="/login"');
    expect(shell).not.toContain("Accesso");
  });

  it("due passi con lo stesso titolo restano due sul sito", () => {
    const page = readFileSync("src/app/page.tsx", "utf8");
    const steps = page.slice(page.indexOf("site.services.map"), page.indexOf("blocks.works"));
    expect(steps).toContain("key={index}");
    expect(steps).not.toContain("key={service.title}");
  });

  it("due citazioni con lo stesso testo restano due sul sito", () => {
    const page = readFileSync("src/app/page.tsx", "utf8");
    const start = page.indexOf("quotes.map");
    const quotes = page.slice(start, page.indexOf("site-entry", start));
    expect(quotes).toContain("key={index}");
    expect(quotes).not.toContain("key={`${quote.author}-${quote.quote}`}");
  });

  it("due passi con lo stesso titolo restano due campi", () => {
    const page = readFileSync("src/app/app/sito/page.tsx", "utf8");
    const steps = page.slice(page.indexOf("services.slice(0, 3)"), page.indexOf("service_body_"));
    expect(steps).toContain("key={index}");
    expect(steps).not.toContain("key={service.title}");
  });

  it("togliere la spunta nasconde il lavoro sul sito", () => {
    expect(workVisibility("on")).toBe(true);
    expect(workVisibility(null)).toBe(false);
    const page = readFileSync("src/app/app/sito/page.tsx", "utf8");
    expect(page).toContain("listPortfolioEditor");
    expect(page).toContain("setWorkVisibilityAction");
    expect(page).toContain('name="visible"');
    const source = readFileSync("src/server/actions.ts", "utf8");
    const start = source.indexOf("export async function setWorkVisibilityAction");
    const body = source.slice(start);
    expect(body).toContain("workVisibility(");
    expect(body).toContain('.from("portfolio_items")');
    expect(body).toContain("published:");
    expect(body).toContain('revalidatePath("/")');
  });
});
