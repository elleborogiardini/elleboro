import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  activeClients,
  archivedIntervention,
  clientLine,
  clientListEmpty,
  clientsMatching,
  appointmentDoneUpdate,
  appointmentReadable,
  interventionDay,
  interventionWhen,
  interventionForClient,
  leftoverIntervention,
  mapsDirections,
  noteOnClient,
  placeKindLabel,
  interventionFromAppointment,
  photosByPlace,
  preferenceCategoryLabel,
  preferenceOnClient,
  privatePhoto,
  publishedWork,
  unpublishedPublicFile,
  unrecordedPrivateFile,
} from "@/domain/dossier";
import { dossierField } from "@/domain/forms";

describe("fascicolo cliente", () => {
  it("un cliente archiviato non resta nell'elenco attivo", () => {
    const rows = activeClients([
      { id: "a", archivedAt: null },
      { id: "b", archivedAt: "2026-05-01T00:00:00.000Z" },
    ]);
    expect(rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("la ricerca trova nome, telefono e località, non l'indirizzo di casa", () => {
    const rows = [
      {
        id: "marta",
        full_name: "Marta Leone",
        phone: "333 000 1111",
        locality: "Giardino sud",
        address: "Via delle Rose 4",
        archivedAt: null,
      },
      {
        id: "luca",
        full_name: "Luca Ferri",
        phone: "340 111 2222",
        locality: "Balcone",
        address: "Via Roma 1",
        archivedAt: null,
      },
      {
        id: "vecchio",
        full_name: "Marta Vecchia",
        phone: null,
        locality: "Terrazzo",
        address: null,
        archivedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(clientsMatching(rows, "marta").map((row) => row.id)).toEqual(["marta"]);
    expect(clientsMatching(rows, "333").map((row) => row.id)).toEqual(["marta"]);
    expect(clientsMatching(rows, "balcone").map((row) => row.id)).toEqual(["luca"]);
    expect(clientsMatching(rows, "Via delle Rose")).toEqual([]);
    expect(clientsMatching(rows, "%").map((row) => row.id)).toEqual(["marta", "luca"]);
  });

  it("la ricerca del telefono ignora spazi e trattini", () => {
    const rows = [
      {
        id: "marta",
        full_name: "Marta Leone",
        phone: "333 000 1111",
        locality: "Bologna",
        address: "Via delle Rose 4",
        archivedAt: null,
      },
      {
        id: "luca",
        full_name: "Luca Ferri",
        phone: "340-111-2222",
        locality: "Milano",
        address: "Via Roma 12",
        archivedAt: null,
      },
    ];
    expect(clientsMatching(rows, "3330001111").map((row) => row.id)).toEqual(["marta"]);
    expect(clientsMatching(rows, "340 111 2222").map((row) => row.id)).toEqual(["luca"]);
    expect(clientsMatching(rows, "1112222").map((row) => row.id)).toEqual(["luca"]);
    expect(clientsMatching(rows, "12")).toEqual([]);
  });

  it("la ricerca del telefono accetta il prefisso italiano", () => {
    const rows = [
      {
        id: "marta",
        full_name: "Marta Leone",
        phone: "333 000 1111",
        locality: "Bologna",
        address: "Via delle Rose 4",
        archivedAt: null,
      },
      {
        id: "luca",
        full_name: "Luca Ferri",
        phone: "340-111-2222",
        locality: "Milano",
        address: "Via Roma 12",
        archivedAt: null,
      },
    ];
    expect(clientsMatching(rows, "+39 333 000 1111").map((row) => row.id)).toEqual(["marta"]);
    expect(clientsMatching(rows, "0039 340 111 2222").map((row) => row.id)).toEqual(["luca"]);
    expect(clientsMatching(rows, "+39")).toEqual([]);
  });

  it("l'elenco vuoto non parla di una ricerca", () => {
    expect(clientListEmpty("")).toBe("Nessun cliente ancora. Il primo si aggiunge qui sotto.");
    expect(clientListEmpty("   ")).toBe("Nessun cliente ancora. Il primo si aggiunge qui sotto.");
    expect(clientListEmpty("marta")).toBe(
      "Nessun cliente con questa ricerca. Aggiungine uno qui sotto.",
    );
    const page = readFileSync("src/app/app/page.tsx", "utf8");
    expect(page).toContain("clientListEmpty(q)");
    expect(page).not.toContain(">Nessun cliente con questa ricerca.");
  });

  it("la ricerca si invia con un pulsante", () => {
    const page = readFileSync("src/app/app/page.tsx", "utf8");
    const form = page.slice(page.indexOf("<form>"), page.indexOf("</form>"));
    expect(form).toContain('name="q"');
    expect(form).toContain('type="submit"');
    expect(form).toContain("Cerca");
  });

  it("la riga in elenco unisce località e telefono e lascia fuori l'indirizzo", () => {
    expect(
      clientLine({
        locality: "Giardino sud",
        phone: "333 000 1111",
        address: "Via delle Rose 4",
      }),
    ).toBe("Giardino sud, 333 000 1111");
    expect(clientLine({ locality: null, phone: "333", address: "Via Roma 1" })).toBe("333");
    expect(clientLine({ locality: null, phone: null, address: "Via Roma 1" })).toBe("");
  });

  it("la foto del luogo resta nel bucket privato e non porta il fascicolo nel sito", () => {
    expect(privatePhoto("cliente-1", "foto.jpg")).toEqual({
      bucket: "private",
      path: "cliente-1/foto.jpg",
    });
  });

  it("la foto non prende il luogo di un altro cliente e non si carica prima del controllo", () => {
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function uploadPhotoAction"),
      action.indexOf("export async function publishPhotoAction"),
    );
    const check = body.indexOf("placeForAppointment");
    const upload = body.indexOf('.from("private")');
    expect(check).toBeGreaterThan(-1);
    expect(upload).toBeGreaterThan(check);
    expect(body).not.toContain('place_id: text(formData, "place_id")');
  });

  it("le foto del fascicolo stanno sotto il loro luogo", () => {
    const groups = photosByPlace(
      [
        { id: "luogo-1", label: "Giardino sud" },
        { id: "luogo-2", label: "Terrazzo" },
      ],
      [
        { id: "foto-1", placeId: "luogo-1" },
        { id: "foto-2", placeId: "altro" },
      ],
    );
    expect(groups).toEqual([
      { id: "luogo-1", label: "Giardino sud", photos: [{ id: "foto-1", placeId: "luogo-1" }] },
      { id: "luogo-2", label: "Terrazzo", photos: [] },
    ]);
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    expect(page).toContain("photosByPlace");
    expect(page).toContain('name="place_id"');
  });

  it("l'intervento non prende il luogo di un altro cliente", () => {
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function createInterventionAction"),
      action.indexOf("export async function savePrivateAction"),
    );
    expect(body).toContain("placeForAppointment");
    expect(body).not.toContain('place_id: text(formData, "place_id")');
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const form = page.slice(
      page.indexOf("action={createInterventionAction}"),
      page.indexOf("action={archiveClientAction}"),
    );
    expect(form).toContain('name="place_id"');
  });

  it("la foto non prende l'intervento di un altro cliente", () => {
    const own = { id: "intervento-1", client_id: "cliente-1" };
    const other = { id: "intervento-2", client_id: "cliente-2" };
    expect(interventionForClient("", "cliente-1", null, null)).toEqual({
      ok: true,
      interventionId: null,
    });
    expect(interventionForClient("intervento-1", "cliente-1", own, null)).toEqual({
      ok: true,
      interventionId: "intervento-1",
    });
    expect(interventionForClient("intervento-2", "cliente-1", other, null).ok).toBe(false);
    expect(interventionForClient("intervento-1", "cliente-1", null, { message: "lettura" }).ok).toBe(false);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function uploadPhotoAction"),
      action.indexOf("export async function publishPhotoAction"),
    );
    const check = body.indexOf("interventionForClient");
    const upload = body.indexOf('.from("private")');
    expect(check).toBeGreaterThan(-1);
    expect(upload).toBeGreaterThan(check);
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const form = page.slice(page.indexOf("action={uploadPhotoAction}"), page.indexOf(">Interventi<"));
    expect(form).toContain('name="intervention_id"');
  });

  it("solo il proprietario avvia le mappe verso l'indirizzo del cliente", () => {
    const destination = mapsDirections("owner", {
      address: "Via delle Rose 4",
      locality: "Bologna",
    });
    expect(destination).toBe("maps://?daddr=Via%20delle%20Rose%204%2C%20Bologna&dirflg=d");
    expect(
      mapsDirections("owner", { address: "Via delle Rose 4", locality: null }),
    ).toBe("maps://?daddr=Via%20delle%20Rose%204&dirflg=d");
    expect(mapsDirections("owner", { address: "  ", locality: "Bologna" })).toBeNull();
    expect(mapsDirections("technician", { address: "Via delle Rose 4", locality: "Bologna" })).toBeNull();
    expect(mapsDirections(null, { address: "Via delle Rose 4", locality: "Bologna" })).toBeNull();
    const dossier = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const list = readFileSync("src/app/app/page.tsx", "utf8");
    expect(dossier).toContain("mapsDirections");
    expect(dossier).toContain("Apri in Mappe");
    expect(list).toContain("mapsDirections");
    expect(list).toContain("Apri in Mappe");
  });

  it("se la foto non si registra nel fascicolo, il file privato si toglie", () => {
    expect(unrecordedPrivateFile({ message: "scrittura" }, "cliente-1/foto.jpg")).toBe("cliente-1/foto.jpg");
    expect(unrecordedPrivateFile(null, "cliente-1/foto.jpg")).toBeNull();
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function uploadPhotoAction"),
      action.indexOf("export async function publishPhotoAction"),
    );
    const remove = body.indexOf('.from("private").remove(');
    const giveUp = body.indexOf('bail(formData, "Non sono riuscito a registrare la foto.")');
    expect(body).toContain("unrecordedPrivateFile");
    expect(remove).toBeGreaterThan(-1);
    expect(remove).toBeLessThan(giveUp);
  });

  it("una nota non si riscrive sul fascicolo di un altro cliente", () => {
    const own = { id: "nota-1", client_id: "cliente-1" };
    const other = { id: "nota-2", client_id: "cliente-2" };
    expect(noteOnClient("", "cliente-1", null, null).ok).toBe(true);
    expect(noteOnClient("nota-1", "cliente-1", own, null).ok).toBe(true);
    expect(noteOnClient("nota-2", "cliente-1", other, null).ok).toBe(false);
    expect(noteOnClient("nota-1", "cliente-1", null, null).ok).toBe(false);
    expect(noteOnClient("nota-1", "cliente-1", null, { message: "lettura" }).ok).toBe(false);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const save = action.slice(
      action.indexOf("export async function saveNoteAction"),
      action.indexOf("export async function archiveNoteAction"),
    );
    const archive = action.slice(
      action.indexOf("export async function archiveNoteAction"),
      action.indexOf("export async function createAppointmentAction"),
    );
    expect(save.indexOf("noteOnClient")).toBeGreaterThan(-1);
    expect(save.indexOf("noteOnClient")).toBeLessThan(save.indexOf(".update(payload)"));
    expect(archive.indexOf("noteOnClient")).toBeGreaterThan(-1);
    expect(archive.indexOf("noteOnClient")).toBeLessThan(archive.indexOf(".update("));
  });

  it("una preferenza non si toglie dal fascicolo di un altro cliente", () => {
    const own = { id: "pref-1", client_id: "cliente-1" };
    const other = { id: "pref-2", client_id: "cliente-2" };
    expect(preferenceOnClient("pref-1", "cliente-1", own, null).ok).toBe(true);
    expect(preferenceOnClient("pref-2", "cliente-1", other, null).ok).toBe(false);
    expect(preferenceOnClient("", "cliente-1", null, null).ok).toBe(false);
    expect(preferenceOnClient("pref-1", "cliente-1", null, { message: "lettura" }).ok).toBe(false);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function removePreferenceAction"),
      action.indexOf("export async function saveNoteAction"),
    );
    expect(body.indexOf("preferenceOnClient")).toBeGreaterThan(-1);
    expect(body.indexOf("preferenceOnClient")).toBeLessThan(body.indexOf(".delete()"));
    const page = readFileSync("src/app/app/clienti/[id]/preferenze/page.tsx", "utf8");
    expect(page).toContain("removePreferenceAction");
    expect(page).toContain("Togli");
  });

  it("un intervento si archivia e non si cancella", () => {
    const own = { id: "intervento-1", client_id: "cliente-1" };
    const other = { id: "intervento-2", client_id: "cliente-2" };
    expect(archivedIntervention("intervento-1", "cliente-1", own, null)).toEqual({
      ok: true,
      id: "intervento-1",
    });
    expect(archivedIntervention("intervento-2", "cliente-1", other, null).ok).toBe(false);
    expect(archivedIntervention("", "cliente-1", null, null).ok).toBe(false);
    expect(archivedIntervention("intervento-1", "cliente-1", null, { message: "lettura" }).ok).toBe(false);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function archiveInterventionAction"),
      action.indexOf("export async function savePrivateAction"),
    );
    expect(body.indexOf("archivedIntervention")).toBeGreaterThan(-1);
    expect(body.indexOf("archivedIntervention")).toBeLessThan(body.indexOf(".update("));
    expect(body).toContain("archived_at:");
    expect(body).not.toContain(".delete(");
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const list = page.slice(page.indexOf(">Interventi<"), page.indexOf("action={createInterventionAction}"));
    expect(list).toContain("archiveInterventionAction");
    expect(list).toContain(">Archivia<");
  });

  it("lo storico mostra il giorno in italiano, non la data del database", () => {
    expect(interventionWhen("2026-05-13")).toBe("13 maggio 2026");
    expect(interventionWhen(" 2026-11-02 ")).toBe("2 novembre 2026");
    expect(interventionWhen("ieri")).toBe("ieri");
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const list = page.slice(page.indexOf(">Interventi<"), page.indexOf("action={createInterventionAction}"));
    expect(list).toContain("interventionWhen(");
    expect(list).not.toContain("${item.happened_on}");
  });

  it("un giorno che non esiste non diventa un altro mese", () => {
    expect(interventionWhen("2026-02-31")).toBe("2026-02-31");
    expect(interventionWhen("2026-05-13")).toBe("13 maggio 2026");
    const now = new Date("2026-05-13T12:00:00.000Z");
    expect(interventionDay("2026-02-31", now)).toBeNull();
    expect(interventionDay("2026-02-29", now)).toBeNull();
    expect(interventionDay("2024-02-29", now)).toBe("2024-02-29");
    expect(dossierField("Scrivi una data valida.")).toBe("date");
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function createInterventionAction"),
      action.indexOf("export async function archiveInterventionAction"),
    );
    expect(body.indexOf("Scrivi una data valida.")).toBeGreaterThan(-1);
    expect(body.indexOf("Scrivi una data valida.")).toBeLessThan(body.indexOf(".insert("));
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const form = page.slice(page.indexOf("action={createInterventionAction}"));
    const date = form.indexOf('name="happened_on"');
    expect(form.indexOf('dossierField(errore) === "date"', date)).toBeGreaterThan(date);
  });

  it("il luogo usa la stessa parola del modulo", () => {
    expect(placeKindLabel("giardino")).toBe("Giardino");
    expect(placeKindLabel("interno")).toBe("Interno");
    expect(placeKindLabel("sconosciuto")).toBe("sconosciuto");
    const page = readFileSync("src/app/app/clienti/[id]/page.tsx", "utf8");
    const places = page.slice(page.indexOf(">Luoghi<"), page.indexOf(">Foto<"));
    expect(places).toContain("placeKindLabel(");
    expect(places).not.toContain("{place.kind}");
  });

  it("la preferenza usa la stessa parola del modulo", () => {
    expect(preferenceCategoryLabel("evitare")).toBe("Da evitare");
    expect(preferenceCategoryLabel("fiore")).toBe("Fiore");
    expect(preferenceCategoryLabel("sconosciuta")).toBe("sconosciuta");
    const page = readFileSync("src/app/app/clienti/[id]/preferenze/page.tsx", "utf8");
    const list = page.slice(page.indexOf("preferences.map"), page.indexOf("Nuova preferenza"));
    expect(list).toContain("preferenceCategoryLabel(");
    expect(list).not.toContain("{item.category}");
  });
});

describe("portfolio", () => {
  it("la copia pubblicata non ha un id cliente", () => {
    const work = publishedWork({
      path: "lavoro.jpg",
      alt: "Siepe di bosso",
      caption: "Primavera",
      clientId: "cliente-1",
    });
    expect(work).toEqual({
      path: "lavoro.jpg",
      alt: "Siepe di bosso",
      caption: "Primavera",
    });
    expect(work).not.toHaveProperty("clientId");
  });

  it("se la pubblicazione non si registra, la foto pubblica si toglie", () => {
    expect(unpublishedPublicFile({ message: "scrittura" }, "lavoro.jpg")).toBe("lavoro.jpg");
    expect(unpublishedPublicFile(null, "lavoro.jpg")).toBeNull();
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function publishPhotoAction"),
      action.indexOf("export async function uploadPortraitAction"),
    );
    const remove = body.indexOf('.from("portfolio").remove(');
    const giveUp = body.lastIndexOf('bail(formData, "Non sono riuscito a pubblicare.")');
    expect(body).toContain("unpublishedPublicFile");
    expect(remove).toBeGreaterThan(-1);
    expect(remove).toBeLessThan(giveUp);
  });
});

describe("agenda", () => {
  it("un appuntamento fatto porta il luogo sull'intervento", () => {
    expect(
      interventionFromAppointment({
        title: "Cura autunnale",
        clientId: "cliente-1",
        startsAt: "2026-11-02T08:00:00.000Z",
        interventionId: null,
        status: "fatto",
        placeId: "luogo-1",
      })?.placeId,
    ).toBe("luogo-1");
    expect(
      interventionFromAppointment({
        title: "Cura autunnale",
        clientId: "cliente-1",
        startsAt: "2026-11-02T08:00:00.000Z",
        interventionId: null,
        status: "fatto",
        placeId: null,
      })?.placeId,
    ).toBeNull();
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function setAppointmentStatusAction"),
      action.indexOf("export async function submitInquiryAction"),
    );
    expect(body).toContain("place_id: draft.placeId");
  });

  it("un appuntamento fatto apre un intervento solo se non è già collegato", () => {
    expect(
      interventionFromAppointment({
        title: "Potatura",
        clientId: "cliente-1",
        startsAt: "2026-05-12T09:00:00.000Z",
        interventionId: null,
        status: "fatto",
      }),
    ).toEqual({
      title: "Potatura",
      clientId: "cliente-1",
      happenedOn: "2026-05-12",
      placeId: null,
    });
    expect(
      interventionFromAppointment({
        title: "Potatura",
        clientId: "cliente-1",
        startsAt: "2026-05-12T09:00:00.000Z",
        interventionId: "intervento-1",
        status: "fatto",
      }),
    ).toBeNull();
    expect(
      interventionFromAppointment({
        title: "Potatura",
        clientId: "cliente-1",
        startsAt: "2026-05-12T09:00:00.000Z",
        interventionId: null,
        status: "previsto",
      }),
    ).toBeNull();
  });

  it("se l'appuntamento non si legge, non diventa fatto senza intervento", () => {
    expect(appointmentReadable(null, { message: "permesso" })).toBe(false);
    expect(appointmentReadable(null, null)).toBe(false);
    expect(appointmentReadable({ id: "appuntamento-1" }, null)).toBe(true);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function setAppointmentStatusAction"),
      action.indexOf("export async function submitInquiryAction"),
    );
    expect(body).toContain("appointmentReadable");
    expect(body).toContain("Non sono riuscito a registrare l'intervento.");
  });

  it("se l'agenda non si aggiorna, l'intervento appena creato si toglie", () => {
    expect(leftoverIntervention({ message: "scrittura" }, "intervento-1")).toBe("intervento-1");
    expect(leftoverIntervention(null, "intervento-1")).toBeNull();
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function setAppointmentStatusAction"),
      action.indexOf("export async function submitInquiryAction"),
    );
    const remove = body.indexOf('from("interventions").delete()');
    const giveUp = body.indexOf('bail(formData, "L\'agenda è riservata al proprietario.")');
    expect(body).toContain("leftoverIntervention");
    expect(remove).toBeGreaterThan(-1);
    expect(remove).toBeLessThan(giveUp);
  });

  it("senza un intervento creato l'appuntamento non risulta fatto", () => {
    expect(appointmentDoneUpdate(null)).toBeNull();
    expect(appointmentDoneUpdate("intervento-1")).toEqual({
      status: "fatto",
      intervention_id: "intervento-1",
    });
  });

  it("l'intervento usa il giorno in Italia, non il giorno UTC", () => {
    expect(
      interventionFromAppointment({
        title: "Potatura",
        clientId: "cliente-1",
        startsAt: "2026-05-12T22:30:00.000Z",
        interventionId: null,
        status: "fatto",
      })?.happenedOn,
    ).toBe("2026-05-13");
  });

  it("senza una data scritta, l'intervento prende il giorno di Roma", () => {
    expect(interventionDay("", new Date("2026-05-12T22:30:00.000Z"))).toBe("2026-05-13");
    expect(interventionDay("2026-01-15", new Date("2026-05-12T22:30:00.000Z"))).toBe("2026-01-15");
  });
});
