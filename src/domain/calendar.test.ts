import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { agendaDay, agendaLocalInput, agendaPlaceLabel, agendaSpan, agendaWhen, buildIcs, compactMonth, movedAppointment, placeForAppointment, romeInstant, romeWindow, upcomingAppointments } from "@/domain/calendar";

const base = {
  id: "apt-1",
  title: "Potatura siepe",
  startsAt: "2026-05-12T09:00:00.000Z",
  endsAt: "2026-05-12T11:00:00.000Z",
  clientName: "Marta Leone",
  placeLabel: "Giardino sud",
  address: "Via delle Rose 4",
  includeAddress: false,
  notes: "Non ama le rose gialle",
  preferences: "colore: blu",
};

describe("feed calendario", () => {
  it("contiene orario, titolo, cliente e luogo", () => {
    const ics = buildIcs([base]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Potatura siepe");
    expect(ics).toContain("Marta Leone");
    expect(ics).toContain("Giardino sud");
    expect(ics).toContain("20260512T090000Z");
    expect(ics).toContain("20260512T110000Z");
  });

  it("senza luogo il calendario non lascia una virgola vuota", () => {
    const location = (events: Parameters<typeof buildIcs>[0]) =>
      buildIcs(events)
        .split("\r\n")
        .find((row) => row.startsWith("LOCATION:"));
    expect(location([{ ...base, placeLabel: " " }])).toBe("LOCATION:Marta Leone");
    expect(location([{ ...base, clientName: " ", includeAddress: false }])).toBe(
      "LOCATION:Giardino sud",
    );
    expect(location([{ ...base, placeLabel: "", includeAddress: true }])).toBe(
      "LOCATION:Marta Leone\\, Via delle Rose 4",
    );
  });

  it("una revisione più alta resta l'origine anche se l'orario si anticipa", () => {
    const ics = buildIcs([
      {
        ...base,
        startsAt: "2026-11-02T07:00:00.000Z",
        endsAt: "2026-11-02T09:00:00.000Z",
        revisedAt: "2026-10-30T18:00:00.000Z",
        sequence: 1761847200,
      },
    ]);
    expect(ics).toContain("UID:apt-1@elleboro");
    expect(ics).toContain("SEQUENCE:1761847200");
    expect(ics).toContain("DTSTAMP:20261030T180000Z");
    expect(ics).toContain("DTSTART:20261102T070000Z");
    const route = readFileSync("src/app/feed/[token]/route.ts", "utf8");
    expect(route).toContain("sequence:");
    expect(route).toContain("Date.now()");
  });

  it("un orario con fuso resta l'istante UTC", () => {
    const ics = buildIcs([
      {
        ...base,
        startsAt: "2026-05-13T00:30:00+02:00",
        endsAt: "2026-05-13T02:30:00+02:00",
      },
    ]);
    expect(ics).toContain("DTSTART:20260512T223000Z");
    expect(ics).toContain("DTEND:20260513T003000Z");
    expect(ics).not.toContain("+0200");
  });

  it("un a capo nell'identificativo non aggiunge un campo", () => {
    const ics = buildIcs([
      {
        ...base,
        id: "apt\rDESCRIPTION:segreto",
        startsAt: "2026-05-12T09:00:00.000Z\rDESCRIPTION:altro",
      },
    ]);
    const lines = ics.split(/\r\n|\n|\r/);
    expect(lines.some((line) => line.startsWith("DESCRIPTION:"))).toBe(false);
    expect(lines.some((line) => line.startsWith("UID:"))).toBe(true);
    expect(lines.some((line) => line.startsWith("DTSTART:"))).toBe(true);
  });

  it("un a capo nel titolo non aggiunge un campo", () => {
    const ics = buildIcs([{ ...base, title: "Potatura\rDESCRIPTION:segreto del cliente" }]);
    const lines = ics.split(/\r\n|\n|\r/);
    expect(lines.some((line) => line.startsWith("DESCRIPTION:"))).toBe(false);
    expect(lines.some((line) => line.startsWith("SUMMARY:"))).toBe(true);
    expect(ics).not.toContain("segreto del cliente\n");
  });

  it("un punto e virgola nel titolo resta nel titolo", () => {
    const ics = buildIcs([
      {
        ...base,
        title: "Potatura;STATUS:CANCELLED",
        clientName: "Marta;Leone",
        notes: undefined,
        preferences: undefined,
      },
    ]);
    expect(ics).toContain("SUMMARY:Potatura\\;STATUS:CANCELLED");
    expect(ics).toContain("LOCATION:Marta\\;Leone\\, Giardino sud");
    expect(ics.split("\r\n").some((line) => line.startsWith("STATUS:"))).toBe(false);
  });

  it("una riga del calendario non supera settantacinque ottetti", () => {
    const title = "Potatura della siepe sul lato lungo, è un lavoro preciso";
    const ics = buildIcs([{ ...base, title: `${title} ${title}` }]);
    const lines = ics.split("\r\n");
    expect(lines.every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(true);
    const unfolded = lines.reduce<string[]>((rows, line) => {
      if (line.startsWith(" ")) rows[rows.length - 1] += line.slice(1);
      else rows.push(line);
      return rows;
    }, []);
    expect(unfolded).toContain(`SUMMARY:${title} ${title}`.replace(/,/g, "\\,"));
  });

  it("un appuntamento annullato esce come annullato, senza le note", () => {
    const ics = buildIcs([{ ...base, cancelled: true }]);
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("UID:apt-1@elleboro");
    expect(ics).not.toContain("rose gialle");
    expect(buildIcs([base])).not.toContain("STATUS:");
    const route = readFileSync("src/app/feed/[token]/route.ts", "utf8");
    const select = readFileSync("src/domain/feed.ts", "utf8");
    expect(route).not.toContain('.neq("status", "annullato")');
    expect(route).toContain("cancelled:");
    expect(select.slice(0, select.indexOf("agendaListSelect"))).toContain("status");
  });

  it("non contiene note ne preferenze", () => {
    const ics = buildIcs([base]);
    expect(ics).not.toContain("rose gialle");
    expect(ics).not.toContain("colore: blu");
  });

  it("senza interruttore non contiene l'indirizzo", () => {
    expect(buildIcs([base])).not.toContain("Via delle Rose");
  });

  it("accetta una data e non fa uscire le note", () => {
    const ics = buildIcs([
      {
        ...base,
        startsAt: new Date("2026-05-12T09:00:00.000Z"),
        endsAt: new Date("2026-05-12T11:00:00.000Z"),
      },
    ]);
    expect(ics).toContain("20260512T090000Z");
    expect(ics).toContain("20260512T110000Z");
    expect(ics).not.toContain("rose gialle");
    expect(ics).not.toContain("Via delle Rose");
  });

  it("la lista mostra i prossimi, non i passati né gli annullati", () => {
    const now = new Date("2026-05-12T12:00:00.000Z");
    const rows = upcomingAppointments(
      [
        { id: "passato", ends_at: "2026-05-11T11:00:00.000Z", status: "previsto" },
        { id: "oggi", ends_at: "2026-05-12T15:00:00.000Z", status: "previsto" },
        { id: "fatto", ends_at: new Date("2026-05-20T11:00:00.000Z"), status: "fatto" },
        { id: "annullato", ends_at: "2026-05-20T11:00:00.000Z", status: "annullato" },
      ],
      now,
    );
    expect(rows.map((row) => row.id)).toEqual(["oggi", "fatto"]);
  });

  it("l'agenda mostra l'orario in Italia", () => {
    const when = agendaWhen("2026-05-12T22:30:00.000Z");
    expect(when).toMatch(/13/);
    expect(when).toMatch(/00:30/);
    expect(agendaDay("2026-05-12T22:30:00.000Z")).toEqual({
      year: 2026,
      month: 5,
      day: 13,
    });
  });

  it("l'orario scritto in agenda è quello di Roma", () => {
    expect(romeInstant("2026-05-13T00:30")).toBe("2026-05-12T22:30:00.000Z");
    expect(romeInstant("2026-01-15T00:30")).toBe("2026-01-14T23:30:00.000Z");
  });

  it("il luogo di un altro cliente non entra nell'appuntamento", () => {
    const own = { id: "luogo-1", client_id: "cliente-1" };
    const other = { id: "luogo-2", client_id: "cliente-2" };
    expect(placeForAppointment("", "cliente-1", null, null)).toEqual({ ok: true, placeId: null });
    expect(placeForAppointment("luogo-1", "cliente-1", own, null)).toEqual({
      ok: true,
      placeId: "luogo-1",
    });
    expect(placeForAppointment("luogo-2", "cliente-1", other, null).ok).toBe(false);
    expect(placeForAppointment("luogo-1", "cliente-1", null, null).ok).toBe(false);
    expect(placeForAppointment("luogo-1", "cliente-1", null, { message: "lettura" }).ok).toBe(false);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function createAppointmentAction"),
      action.indexOf("export async function setAppointmentStatusAction"),
    );
    expect(body).toContain("placeForAppointment");
    expect(body).not.toContain('place_id: text(formData, "place_id")');
  });

  it("in agenda il luogo si legge insieme al cliente", () => {
    expect(agendaPlaceLabel("Marta Leone", "Giardino sud")).toBe("Marta Leone, Giardino sud");
    expect(agendaPlaceLabel("", "Giardino sud")).toBe("Giardino sud");
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    const form = page.slice(page.indexOf("Nuovo appuntamento"));
    const field = form.slice(form.indexOf('name="place_id"'), form.indexOf('name="starts_at"'));
    expect(field).toContain("agendaPlaceLabel");
    expect(field).not.toContain("{place.label}");
  });

  it("in agenda si legge anche quando finisce", () => {
    const start = "2026-11-02T08:00:00.000Z";
    const end = "2026-11-02T10:00:00.000Z";
    const same = agendaSpan(start, end);
    expect(same.startsWith(agendaWhen(start))).toBe(true);
    expect(same.endsWith("alle 11:00")).toBe(true);
    expect(same.match(/2026/g)?.length).toBe(1);
    const later = "2026-11-03T10:00:00.000Z";
    expect(agendaSpan(start, later)).toBe(`${agendaWhen(start)} alle ${agendaWhen(later)}`);
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    const listed = page.slice(page.indexOf("appointments.map"), page.indexOf("Nuovo appuntamento"));
    expect(listed).toContain("agendaSpan(");
    expect(listed).not.toContain("agendaWhen(item.starts_at)");
  });

  it("la lista dell'agenda unisce cliente e luogo con la virgola", () => {
    expect(agendaPlaceLabel("Marta Leone", "")).toBe("Marta Leone");
    expect(agendaPlaceLabel("Marta Leone", "  ")).toBe("Marta Leone");
    expect(agendaPlaceLabel("  ", "  ")).toBe("");
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    const listed = page.slice(page.indexOf("appointments.map"), page.indexOf("Nuovo appuntamento"));
    expect(listed).toContain("agendaPlaceLabel(");
    expect(listed).not.toContain("{item.places?.label}");
  });

  it("il mese in agenda è compatto e non è una griglia di tutti i giorni", () => {
    expect(compactMonth(["2026-11-02T08:00:00.000Z"], new Date("2026-10-30T12:00:00.000Z"))).toEqual({
      label: "novembre 2026",
      days: [2],
    });
    expect(
      compactMonth(
        ["2026-11-02T08:00:00.000Z", "2026-11-02T15:00:00.000Z", "2026-11-18T08:00:00.000Z"],
        new Date("2026-10-30T12:00:00.000Z"),
      ).days,
    ).toEqual([2, 18]);
    expect(compactMonth([], new Date("2026-10-30T12:00:00.000Z"))).toEqual({
      label: "ottobre 2026",
      days: [],
    });
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    expect(page).toContain("compactMonth");
    expect(page).not.toContain("grid-cols-7");
  });

  it("spostare un appuntamento cambia l'orario dello stesso evento", () => {
    expect(agendaLocalInput("2026-11-02T08:00:00.000Z")).toBe("2026-11-02T09:00");
    const moved = movedAppointment(
      "app-1",
      { id: "app-1" },
      null,
      "2026-11-03T10:00",
      "2026-11-03T12:00",
    );
    expect(moved.ok).toBe(true);
    if (moved.ok) {
      expect(moved.id).toBe("app-1");
      expect(moved.startsAt).toBe(romeInstant("2026-11-03T10:00"));
      expect(moved.endsAt).toBe(romeInstant("2026-11-03T12:00"));
    }
    expect(movedAppointment("app-1", { id: "altro" }, null, "2026-11-03T10:00", "2026-11-03T12:00").ok).toBe(false);
    expect(movedAppointment("app-1", null, { message: "lettura" }, "2026-11-03T10:00", "2026-11-03T12:00").ok).toBe(false);
    expect(movedAppointment("app-1", { id: "app-1" }, null, "2026-11-03T12:00", "2026-11-03T10:00").ok).toBe(false);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function moveAppointmentAction"),
      action.indexOf("export async function setAppointmentStatusAction"),
    );
    expect(body.indexOf("movedAppointment")).toBeGreaterThan(-1);
    expect(body.indexOf("movedAppointment")).toBeLessThan(body.indexOf(".update("));
    expect(body).not.toContain("client_id");
    const page = readFileSync("src/app/app/agenda/page.tsx", "utf8");
    expect(page).toContain("moveAppointmentAction");
    expect(page).toContain("Sposta");
  });

  it("un orario che a Roma non esiste non si salva al contrario", () => {
    const gap = romeWindow("2026-03-29T02:30", "2026-03-29T03:00");
    expect(gap.ok).toBe(false);
    const day = romeWindow("2026-11-02T09:00", "2026-11-02T11:00");
    expect(day.ok).toBe(true);
    if (!day.ok) return;
    expect(day.endsAt > day.startsAt).toBe(true);
    const action = readFileSync("src/server/actions.ts", "utf8");
    const body = action.slice(
      action.indexOf("export async function createAppointmentAction"),
      action.indexOf("export async function moveAppointmentAction"),
    );
    expect(body.indexOf("romeWindow(")).toBeGreaterThan(body.indexOf("parseAppointment("));
    expect(body.indexOf("romeWindow(")).toBeLessThan(body.indexOf(".insert("));
  });

  it("un orario che a Roma non esiste non diventa un'altra ora", () => {
    const gap = romeWindow("2026-03-29T02:30", "2026-03-29T04:00");
    expect(gap.ok).toBe(false);
    const before = romeWindow("2026-03-29T01:30", "2026-03-29T03:30");
    expect(before.ok).toBe(true);
    const overlap = romeWindow("2026-10-25T02:30", "2026-10-25T03:30");
    expect(overlap.ok).toBe(true);
    expect(
      movedAppointment("app-1", { id: "app-1" }, null, "2026-03-29T02:30", "2026-03-29T04:00").ok,
    ).toBe(false);
  });

  it("con l'interruttore contiene l'indirizzo", () => {
    expect(buildIcs([{ ...base, includeAddress: true }])).toContain(
      "Via delle Rose 4",
    );
  });
});
