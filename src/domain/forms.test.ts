import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  fieldInvalid,
  inquiryField,
  parseAppointment,
  parseAppointmentStatus,
  parseClient,
  parseInquiry,
  parseInquiryStatus,
  parseIntervention,
  parseNote,
  noticeField,
  parsePlace,
  parsePreference,
  photoError,
  actionNotice,
  agendaField,
  clientField,
  dossierField,
  noteField,
  movedError,
  notedError,
  quotedError,
  parseHeroLead,
  preferenceField,
  quoteField,
  parsePublishAlt,
  parseRequiredLine,
  parseServices,
  parseSiteEmail,
  parseSitePhone,
  parseTestimonial,
} from "@/domain/forms";

describe("fascicolo cliente", () => {
  it("non salva un cliente senza nome", () => {
    expect(parseClient({ fullName: "  ", phone: "", email: "", address: "", locality: "" }).ok).toBe(
      false,
    );
    const saved = parseClient({
      fullName: " Marta Leone ",
      phone: "333",
      email: "",
      address: "Via delle Rose 4",
      locality: "Bologna",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value.fullName).toBe("Marta Leone");
  });

  it("un telefono senza cifre non si salva e non segna il nome", () => {
    const saved = parseClient({
      fullName: "Marta Leone",
      phone: "ciao",
      email: "",
      address: "",
      locality: "Bologna",
    });
    expect(saved.ok).toBe(false);
    if (!saved.ok) expect(saved.error).toBe("Scrivi un numero, oppure lascialo vuoto.");
    expect(
      parseClient({ fullName: "Marta Leone", phone: "", email: "", address: "", locality: "" }).ok,
    ).toBe(true);
    expect(clientField("Scrivi un numero, oppure lascialo vuoto.")).toBe("phone");
    expect(clientField("Scrivi il nome.")).toBe("full_name");
    const page = readFileSync("src/app/app/page.tsx", "utf8");
    const phone = page.indexOf('name="phone"');
    expect(page.indexOf('clientField(errore) === "phone"', phone)).toBeGreaterThan(phone);
    const dossier = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const dossierPhone = dossier.indexOf('name="phone"');
    expect(dossier.indexOf('clientField(errore) === "phone"', dossierPhone)).toBeGreaterThan(
      dossierPhone,
    );
  });

  it("una mail che non è una mail non si salva e non segna il nome", () => {
    const saved = parseClient({
      fullName: "Marta Leone",
      phone: "",
      email: "ciao",
      address: "",
      locality: "Bologna",
    });
    expect(saved.ok).toBe(false);
    if (!saved.ok) expect(saved.error).toBe("Scrivi una mail, oppure lasciala vuota.");
    expect(
      parseClient({
        fullName: "Marta Leone",
        phone: "",
        email: "studio@example.com",
        address: "",
        locality: "",
      }).ok,
    ).toBe(true);
    expect(clientField("Scrivi una mail, oppure lasciala vuota.")).toBe("email");
    expect(clientField("Scrivi il nome.")).toBe("full_name");
    const page = readFileSync("src/app/app/page.tsx", "utf8");
    const email = page.indexOf('name="email"');
    expect(page.indexOf('clientField(errore) === "email"', email)).toBeGreaterThan(email);
    const dossier = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const dossierEmail = dossier.indexOf('name="email"');
    expect(dossier.indexOf('clientField(errore) === "email"', dossierEmail)).toBeGreaterThan(
      dossierEmail,
    );
  });

  it("non salva una nota senza titolo", () => {
    expect(parseNote({ title: " ", body: "Il cancello è sul retro." }).ok).toBe(false);
    const saved = parseNote({ title: " Accesso ", body: "Il cancello è sul retro." });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toEqual({ title: "Accesso", body: "Il cancello è sul retro." });
  });

  it("non salva una preferenza con una categoria fuori elenco", () => {
    expect(parsePreference({ category: "segreto", label: "rose" }).ok).toBe(false);
    const saved = parsePreference({ category: "evitare", label: " rose gialle " });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toEqual({ category: "evitare", label: "rose gialle" });
  });
});

describe("fascicolo, luoghi", () => {
  it("non salva un luogo senza nome o con un tipo fuori elenco", () => {
    expect(parsePlace({ label: " ", kind: "giardino" }).ok).toBe(false);
    expect(parsePlace({ label: "Terrazzo sud", kind: "segreto" }).ok).toBe(false);
    const saved = parsePlace({ label: " Terrazzo sud ", kind: "terrazzo" });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toEqual({ label: "Terrazzo sud", kind: "terrazzo" });
  });
});

describe("biglietto da visita", () => {
  it("senza numero il sito non salva una cifra", () => {
    const empty = parseSitePhone("  ");
    expect(empty.ok).toBe(true);
    if (!empty.ok) return;
    expect(empty.value).toBeNull();
    const saved = parseSitePhone(" 333 000 1111 ");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("333 000 1111");
    const word = parseSitePhone("ciao");
    expect(word.ok).toBe(false);
    if (!word.ok) expect(word.error).toMatch(/numero/);
  });

  it("senza una mail vera il sito non ne pubblica una", () => {
    const empty = parseSiteEmail("  ");
    expect(empty.ok).toBe(true);
    if (!empty.ok) return;
    expect(empty.value).toBeNull();
    const saved = parseSiteEmail(" studio@example.com ");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("studio@example.com");
    const word = parseSiteEmail("non è una mail");
    expect(word.ok).toBe(false);
    const injected = parseSiteEmail("studio@example.com\nBCC:altro@example.com");
    expect(injected.ok).toBe(false);
    const source = readFileSync("src/server/actions.ts", "utf8");
    const save = source.slice(source.indexOf("export async function saveSiteAction"));
    expect(save).toContain("parseSiteEmail");
    expect(save).not.toContain('contact_email: text(formData, "contact_email")');
  });

  it("il ritratto non resta senza testo alternativo", () => {
    expect(parsePublishAlt("  ").ok).toBe(false);
    const saved = parsePublishAlt(" Hasith Conthrath, Elleboro Giardini ");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("Hasith Conthrath, Elleboro Giardini");
    const source = readFileSync("src/server/actions.ts", "utf8");
    const save = source.slice(source.indexOf("export async function saveSiteAction"));
    expect(save).toContain("parsePublishAlt(text(formData, \"portrait_alt\"))");
    expect(save).not.toContain('portrait_alt: text(formData, "portrait_alt")');
  });

  it("i tre passi restano tutti, con titolo e frase", () => {
    const blank = parseServices([
      { title: "Ascolto", body: "Capisco il luogo." },
      { title: "Progetto", body: "   " },
      { title: "Cura", body: "Torno nelle stagioni." },
    ]);
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(blank.error).toBe("Ogni passo ha un titolo e una frase.");
    const dropped = parseServices([
      { title: "Ascolto", body: "Capisco il luogo." },
      { title: "Cura", body: "Torno nelle stagioni." },
    ]);
    expect(dropped.ok).toBe(false);
    const saved = parseServices([
      { title: " Ascolto ", body: " Capisco il luogo. " },
      { title: "Progetto", body: "Disegno un verde." },
      { title: "Cura", body: "Torno nelle stagioni." },
    ]);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toEqual([
      { title: "Ascolto", body: "Capisco il luogo." },
      { title: "Progetto", body: "Disegno un verde." },
      { title: "Cura", body: "Torno nelle stagioni." },
    ]);
    const source = readFileSync("src/server/actions.ts", "utf8");
    const save = source.slice(source.indexOf("export async function saveSiteAction"));
    const siteSave = save.slice(0, save.indexOf("export async function saveTestimonialAction"));
    expect(siteSave).toContain("parseServices");
    expect(siteSave).not.toContain(".filter((item) => item.title)");
  });

  it("la frase del biglietto sta in venti parole", () => {
    expect(parseHeroLead("  ").ok).toBe(false);
    const long = parseHeroLead(Array.from({ length: 21 }, () => "verde").join(" "));
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.error).toMatch(/venti/);
    const saved = parseHeroLead("  Cura di giardini, balconi e terrazzi. ");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("Cura di giardini, balconi e terrazzi.");
  });

  it("il biglietto non si salva senza nome", () => {
    const empty = parseRequiredLine("  ", "Scrivi il nome.");
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("Scrivi il nome.");
    const saved = parseRequiredLine(" Hasith Conthrath ", "Scrivi il nome.");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("Hasith Conthrath");
  });

  it("chi sono non si pubblica vuoto", () => {
    const empty = parseRequiredLine("  ", "Scrivi chi sei.");
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error).toBe("Scrivi chi sei.");
    const saved = parseRequiredLine("  Curo giardini, balconi e terrazzi. ", "Scrivi chi sei.");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("Curo giardini, balconi e terrazzi.");
    const source = readFileSync("src/server/actions.ts", "utf8");
    const save = source.slice(source.indexOf("export async function saveSiteAction"));
    const siteSave = save.slice(0, save.indexOf("export async function saveTestimonialAction"));
    expect(siteSave).toContain('parseRequiredLine(text(formData, "bio"), "Scrivi chi sei.")');
    expect(siteSave).not.toContain('bio: text(formData, "bio")');
  });

  it("l'errore del sito sta sotto il campo che non va", () => {
    expect(noticeField("Scrivi chi sei.")).toBe("bio");
    expect(noticeField("Ogni passo ha un titolo e una frase.")).toBe("services");
    expect(noticeField("Scrivi una mail, oppure lasciala vuota.")).toBe("contact_email");
    expect(noticeField("Non sono riuscito a salvare il sito.")).toBeNull();
    expect(noticeField("  ")).toBeNull();
    const page = readFileSync("src/app/app/sito/page.tsx", "utf8");
    const form = page.slice(page.indexOf("saveSiteAction"), page.indexOf("Salva testi"));
    const bio = form.indexOf('name="bio"');
    const steps = form.lastIndexOf("service_body_");
    expect(form.indexOf('noticeField(errore) === "bio"', bio)).toBeGreaterThan(bio);
    expect(form.indexOf('noticeField(errore) === "services"', steps)).toBeGreaterThan(steps);
  });

  it("nel nuovo cliente l'errore sta sotto il nome", () => {
    expect(clientField("Scrivi il nome.")).toBe("full_name");
    expect(clientField("Non sono riuscito a salvare il cliente.")).toBeNull();
    expect(clientField("  ")).toBeNull();
    const page = readFileSync("src/app/app/page.tsx", "utf8");
    const form = page.slice(page.indexOf("createClientAction"), page.indexOf("Salva"));
    const name = form.indexOf('name="full_name"');
    expect(name).toBeGreaterThan(-1);
    expect(form.indexOf('clientField(errore) === "full_name"', name)).toBeGreaterThan(name);
  });

  it("nel fascicolo il nome vuoto non segna i luoghi", () => {
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    expect(page).toContain("updateClientAction");
    const name = page.indexOf('name="full_name"');
    expect(name).toBeGreaterThan(-1);
    expect(page.indexOf('clientField(errore) === "full_name"', name)).toBeGreaterThan(name);
    const places = page.slice(page.indexOf(">Luoghi<"), page.indexOf(">Foto<"));
    expect(places).toContain("clientField(errore)");
    expect(places).not.toContain('clientField(errore) === "full_name"');
  });

  it("una nota senza titolo non segna quelle già scritte", () => {
    expect(noteField("Scrivi il titolo della nota.")).toBe("title");
    expect(noteField("Le note sono riservate al proprietario.")).toBeNull();
    expect(noteField("  ")).toBeNull();
    const page = readFileSync("src/app/app/clienti/[id]/note/page.tsx", "utf8");
    const fresh = page.slice(page.indexOf("Nuova sezione"), page.indexOf("Aggiungi"));
    const title = fresh.indexOf('name="title"');
    expect(title).toBeGreaterThan(-1);
    expect(fresh.indexOf('noteField(errore) === "title"', title)).toBeGreaterThan(title);
    const saved = page.slice(page.indexOf("notes.map"), page.indexOf("Nuova sezione"));
    expect(saved).not.toContain("fieldInvalid(errore)");
  });

  it("l'errore di una nota già scritta resta su quella nota", () => {
    const edited = new URL(notedError("/app/clienti/abc/note", "nota-1", "Scrivi il titolo della nota."), "http://local");
    expect(edited.searchParams.get("nota")).toBe("nota-1");
    expect(edited.searchParams.get("errore")).toBe("Scrivi il titolo della nota.");
    const created = new URL(notedError("/app/clienti/abc/note", " ", "Scrivi il titolo della nota."), "http://local");
    expect(created.searchParams.has("nota")).toBe(false);
    expect(created.searchParams.get("errore")).toBe("Scrivi il titolo della nota.");
    const page = readFileSync("src/app/app/clienti/[id]/note/page.tsx", "utf8");
    const listed = page.slice(page.indexOf("notes.map"), page.indexOf("Nuova sezione"));
    expect(listed).toContain("nota === note.id");
    const fresh = page.slice(page.indexOf("Nuova sezione"));
    expect(fresh).toContain("!nota");
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function saveNoteAction"),
      action.indexOf("export async function archiveNoteAction"),
    );
    expect(body.indexOf("notedError(")).toBeGreaterThan(body.indexOf("parseNote("));
    expect(body.indexOf("notedError(")).toBeLessThan(body.indexOf(".update("));
  });

  it("un appuntamento incompleto non segna quelli già in agenda", () => {
    expect(agendaField("Controlla titolo, cliente e orari.")).toBe("title");
    expect(agendaField("Controlla gli orari dell'appuntamento.")).toBe("move");
    expect(agendaField("L'agenda è riservata al proprietario.")).toBeNull();
    expect(agendaField("  ")).toBeNull();
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    const listed = page.slice(page.indexOf("appointments.map"), page.indexOf("Nuovo appuntamento"));
    expect(listed).not.toContain("fieldInvalid(errore)");
    expect(listed).toContain('agendaField(errore) === "move"');
    const fresh = page.slice(page.indexOf("Nuovo appuntamento"), page.indexOf("Calendario esterno"));
    const title = fresh.indexOf('name="title"');
    expect(title).toBeGreaterThan(-1);
    expect(fresh.indexOf('agendaField(errore) === "title"', title)).toBeGreaterThan(title);
  });

  it("l'errore di uno spostamento resta su quell'appuntamento", () => {
    const message = "Controlla gli orari dell'appuntamento.";
    const edited = new URL(movedError("/app/agenda", "app-1", message), "http://local");
    expect(edited.searchParams.get("sposta")).toBe("app-1");
    expect(edited.searchParams.get("errore")).toBe(message);
    const blank = new URL(movedError("/app/agenda", " ", message), "http://local");
    expect(blank.searchParams.has("sposta")).toBe(false);
    expect(blank.searchParams.get("errore")).toBe(message);
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    const listed = page.slice(page.indexOf("appointments.map"), page.indexOf("Nuovo appuntamento"));
    expect(listed).toContain("sposta === item.id");
    expect(listed).not.toContain("fieldInvalid(errore)");
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function moveAppointmentAction"),
      action.indexOf("export async function setAppointmentStatusAction"),
    );
    expect(body.indexOf("movedError(")).toBeGreaterThan(body.indexOf("movedAppointment("));
    expect(body.indexOf("movedError(")).toBeLessThan(body.indexOf(".update("));
  });

  it("una preferenza non valida non segna le specifiche", () => {
    expect(preferenceField("Scegli una categoria valida.")).toBe("pref_category");
    expect(preferenceField("Queste note sono riservate al proprietario.")).toBeNull();
    expect(preferenceField("  ")).toBeNull();
    const page = readFileSync("src/app/app/clienti/[id]/preferenze/page.tsx", "utf8");
    const form = page.slice(page.indexOf("savePrivateAction"), page.indexOf("Salva"));
    const category = form.indexOf('name="pref_category"');
    expect(category).toBeGreaterThan(form.indexOf('name="specifics"'));
    expect(form.indexOf('preferenceField(errore) === "pref_category"', category)).toBeGreaterThan(category);
    expect(form.slice(0, category)).not.toContain("field-invalid");
  });

  it("una preferenza non valida non riscrive le specifiche", () => {
    const source = readFileSync("src/server/actions.ts", "utf8");
    const action = source.slice(
      source.indexOf("export async function savePrivateAction"),
      source.indexOf("export async function removePreferenceAction"),
    );
    const gate = action.indexOf("parsePreference");
    const write = action.indexOf('from("client_private")');
    expect(gate).toBeGreaterThan(-1);
    expect(write).toBeGreaterThan(gate);
  });

  it("un luogo senza nome non segna l'intervento", () => {
    expect(dossierField("Dai un nome al luogo.")).toBe("label");
    expect(dossierField("Scrivi cosa hai fatto.")).toBe("title");
    expect(dossierField("Scrivi il testo alternativo.")).toBe("alt");
    expect(dossierField("Non sono riuscito a registrare la foto.")).toBeNull();
    expect(dossierField("  ")).toBeNull();
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const places = page.slice(page.indexOf(">Luoghi<"), page.indexOf(">Foto<"));
    const photos = page.slice(page.indexOf(">Foto<"), page.indexOf(">Interventi<"));
    const works = page.slice(page.indexOf(">Interventi<"));
    const label = places.indexOf('name="label"');
    const title = works.indexOf('name="title"');
    const alt = photos.indexOf('name="alt"');
    expect(label).toBeGreaterThan(-1);
    expect(places.indexOf('dossierField(errore) === "label"', label)).toBeGreaterThan(label);
    expect(works.indexOf('dossierField(errore) === "title"', title)).toBeGreaterThan(title);
    expect(photos.indexOf('dossierField(errore) === "alt"', alt)).toBeGreaterThan(alt);
    expect(places).not.toContain('dossierField(errore) === "title"');
    expect(works).not.toContain('dossierField(errore) === "label"');
  });

  it("l'errore di una foto resta su quella foto", () => {
    const message = "Scrivi il testo alternativo.";
    const edited = new URL(photoError("/app/clienti/abc", "foto-1", message), "http://local");
    expect(edited.searchParams.get("foto")).toBe("foto-1");
    expect(edited.searchParams.get("errore")).toBe(message);
    const blank = new URL(photoError("/app/clienti/abc", " ", message), "http://local");
    expect(blank.searchParams.has("foto")).toBe(false);
    expect(blank.searchParams.get("errore")).toBe(message);
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const photos = page.slice(page.indexOf(">Foto<"), page.indexOf(">Interventi<"));
    expect(photos).toContain("foto === photo.id");
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function publishPhotoAction"),
      action.indexOf("export async function uploadPortraitAction"),
    );
    expect(body.indexOf("photoError(")).toBeGreaterThan(body.indexOf("parsePublishAlt("));
    expect(body.indexOf("photoError(")).toBeLessThan(body.indexOf(".upload("));
  });

  it("un trattino lungo nell'attribuzione non segna i testi del sito", () => {
    expect(quoteField("Nell'attribuzione non usare il trattino lungo.")).toBe("author");
    expect(quoteField("Servono citazione, nome e contesto.")).toBe("quote");
    expect(quoteField("Scrivi chi sei.")).toBeNull();
    expect(quoteField("  ")).toBeNull();
    const page = readFileSync("src/app/app/sito/page.tsx", "utf8");
    const site = page.slice(page.indexOf("saveSiteAction"), page.indexOf(">Testimonianze<"));
    const quotes = page.slice(page.indexOf(">Testimonianze<"));
    expect(site).toContain("quoteField(errore)");
    expect(site).not.toContain('quoteField(errore) === "author"');
    const author = quotes.indexOf('name="author"');
    expect(author).toBeGreaterThan(-1);
    expect(quotes.indexOf('quoteField(errore) === "author"', author)).toBeGreaterThan(author);
  });

  it("l'errore di una testimonianza già scritta resta su quella testimonianza", () => {
    const message = "Nell'attribuzione non usare il trattino lungo.";
    const edited = new URL(quotedError("/app/sito", "voce-1", message), "http://local");
    expect(edited.searchParams.get("voce")).toBe("voce-1");
    expect(edited.searchParams.get("errore")).toBe(message);
    const created = new URL(quotedError("/app/sito", " ", message), "http://local");
    expect(created.searchParams.has("voce")).toBe(false);
    expect(created.searchParams.get("errore")).toBe(message);
    const page = readFileSync("src/app/app/sito/page.tsx", "utf8");
    const listed = page.slice(page.indexOf("quotes.map"), page.indexOf(">Nuova<"));
    expect(listed).toContain("voce === quote.id");
    const fresh = page.slice(page.indexOf(">Nuova<"));
    expect(fresh).toContain("!voce");
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function saveTestimonialAction"),
      action.indexOf("export async function uploadPhotoAction"),
    );
    expect(body.indexOf("quotedError(")).toBeGreaterThan(body.indexOf("parseTestimonial("));
    expect(body.indexOf("quotedError(")).toBeLessThan(body.indexOf(".update("));
  });

  it("un errore di salvataggio resta leggibile e un avviso vuoto no", () => {
    expect(actionNotice("  La frase sta in venti parole. ")).toBe("La frase sta in venti parole.");
    expect(actionNotice(" ")).toBeNull();
    expect(actionNotice(undefined)).toBeNull();
  });

  it("un errore colora il bordo del campo e non lo scuote", () => {
    expect(fieldInvalid("Attendi un momento e riprova.")).toBe("field-invalid");
    expect(fieldInvalid(" ")).toBe("");
    expect(fieldInvalid(undefined)).toBe("");
    const css = readFileSync("src/app/globals.css", "utf8");
    const start = css.indexOf(".field-invalid .field input");
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toContain("border-bottom-color: var(--danger)");
    expect(css).not.toMatch(/@keyframes\s+shake/);
    for (const file of [
      "src/components/inquiry-form.tsx",
      "src/components/form-note.tsx",
      "src/app/login/page.tsx",
      "src/app/app/page.tsx",
      "src/app/app/sito/page.tsx",
      "src/app/app/agenda/page.tsx",
      "src/app/app/clienti/[id]/page.tsx",
      "src/app/app/clienti/[id]/preferenze/page.tsx",
      "src/app/app/clienti/[id]/note/page.tsx",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("fieldInvalid(");
      expect(source).toContain("ActionNotice");
    }
  });
});

describe("fascicolo, interventi", () => {
  it("non registra un intervento senza dire cosa è stato fatto", () => {
    expect(parseIntervention({ title: "  " }).ok).toBe(false);
    const saved = parseIntervention({ title: " Potatura " });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value.title).toBe("Potatura");
  });

  it("non pubblica una foto senza testo alternativo", () => {
    expect(parsePublishAlt("  ").ok).toBe(false);
    const saved = parsePublishAlt(" Siepe di bosso ");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value).toBe("Siepe di bosso");
  });
});

describe("agenda", () => {
  it("non salva un appuntamento che finisce prima di iniziare e non accende l'indirizzo da solo", () => {
    expect(
      parseAppointment({
        title: "Potatura",
        clientId: "cliente-1",
        startsAt: "2026-05-12T11:00",
        endsAt: "2026-05-12T09:00",
        includeAddress: false,
      }).ok,
    ).toBe(false);
    const saved = parseAppointment({
      title: " Potatura ",
      clientId: "cliente-1",
      startsAt: "2026-05-12T09:00",
      endsAt: "2026-05-12T11:00",
      includeAddress: false,
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value.includeAddress).toBe(false);
    expect(saved.value.title).toBe("Potatura");
  });

  it("accetta solo previsto, fatto e annullato", () => {
    expect(parseAppointmentStatus("segreto").ok).toBe(false);
    expect(parseAppointmentStatus("fatto").ok).toBe(true);
    expect(parseAppointmentStatus("annullato").ok).toBe(true);
    expect(parseAppointmentStatus("previsto").ok).toBe(true);
  });
});

describe("richiesta pubblica", () => {
  it("rifiuta un tipo di luogo che non è nel modulo e non crea un fascicolo", () => {
    const saved = parseInquiry({
      name: "Luca Ferri",
      contact: "3331112223",
      placeKind: "segreto",
      need: "cura",
      area: "Bologna",
      message: "Vorrei una visita.",
    });
    expect(saved.ok).toBe(false);
    if (!saved.ok) expect(saved.error).toBe("Scegli il tipo di luogo.");
    const name = parseInquiry({
      name: " ",
      contact: "3331112223",
      placeKind: "giardino",
      need: "cura",
      area: "",
      message: "Vorrei una visita.",
    });
    expect(name.ok).toBe(false);
    if (!name.ok) expect(name.error).toBe("Scrivi il nome.");
    const contact = parseInquiry({
      name: "Luca Ferri",
      contact: " ",
      placeKind: "giardino",
      need: "cura",
      area: "",
      message: "Vorrei una visita.",
    });
    expect(contact.ok).toBe(false);
    if (!contact.ok) expect(contact.error).toBe("Scrivi un telefono o una mail.");
    const message = parseInquiry({
      name: "Luca Ferri",
      contact: "3331112223",
      placeKind: "giardino",
      need: "cura",
      area: "",
      message: " ",
    });
    expect(message.ok).toBe(false);
    if (!message.ok) expect(message.error).toBe("Scrivi il messaggio.");
    expect(inquiryField("Scrivi il nome.")).toBe("name");
    expect(inquiryField("Scrivi un telefono o una mail.")).toBe("contact");
    expect(inquiryField("Scegli il tipo di luogo.")).toBe("place");
    expect(inquiryField("Scrivi il messaggio.")).toBe("message");
    expect(inquiryField("Attendi un momento e riprova.")).toBeNull();
    expect(inquiryField("Troppe richieste. Riprova più tardi.")).toBeNull();
  });

  it("il contatto è un telefono o una mail", () => {
    const base = {
      name: "Luca Ferri",
      placeKind: "giardino",
      need: "cura",
      area: "",
      message: "Vorrei una visita.",
    };
    const word = parseInquiry({ ...base, contact: "ciao" });
    expect(word.ok).toBe(false);
    if (!word.ok) expect(word.error).toBe("Scrivi un telefono o una mail.");
    expect(parseInquiry({ ...base, contact: "12" }).ok).toBe(false);
    expect(parseInquiry({ ...base, contact: "luca@example.com" }).ok).toBe(true);
    expect(parseInquiry({ ...base, contact: "+39 333 111 2223" }).ok).toBe(true);
  });

  it("il modulo segna il campo del contatto", () => {
    const form = readFileSync("src/components/inquiry-form.tsx", "utf8");
    const nameField = form.indexOf('name="name"');
    expect(form.indexOf('inquiryField(state.error) === "name"', nameField)).toBeGreaterThan(nameField);
    expect(form).toContain('inquiryField(state.error) === "message"');
    const ok = parseInquiry({
      name: " Luca Ferri ",
      contact: "3331112223",
      placeKind: "balcone",
      need: "cura",
      area: "Bologna",
      message: "Vorrei una visita.",
    });
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.value).not.toHaveProperty("clientId");
    expect(ok.value.placeKind).toBe("balcone");
  });
});

describe("richieste", () => {
  it("accetta solo nuova, in corso e chiusa", () => {
    expect(parseInquiryStatus("segreta").ok).toBe(false);
    expect(parseInquiryStatus("nuova").ok).toBe(true);
    expect(parseInquiryStatus("in corso").ok).toBe(true);
    expect(parseInquiryStatus("chiusa").ok).toBe(true);
  });
});

describe("testimonianze", () => {
  it("non salva una testimonianza senza citazione, nome o contesto", () => {
    expect(parseTestimonial({ quote: "", author: "Anna", context: "Giardino" }).ok).toBe(false);
    expect(parseTestimonial({ quote: "Preciso.", author: "", context: "Giardino" }).ok).toBe(false);
    expect(parseTestimonial({ quote: "Preciso.", author: "Anna", context: "" }).ok).toBe(false);
  });

  it("l'attribuzione non usa il trattino lungo", () => {
    expect(parseTestimonial({ quote: "Preciso.", author: "Anna — Bologna", context: "Giardino" }).ok).toBe(false);
    expect(parseTestimonial({ quote: "Preciso.", author: "Anna", context: "Giardino — sud" }).ok).toBe(false);
    expect(parseTestimonial({ quote: "Preciso — e chiaro.", author: "Anna", context: "Giardino" }).ok).toBe(true);
  });
});
