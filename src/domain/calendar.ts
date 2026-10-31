const rome = "Europe/Rome";

function asDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function romeParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: rome,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(asDate(value));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

export function agendaWhen(value: string | Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: rome,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(asDate(value));
}

export function agendaSpan(startsAt: string | Date, endsAt: string | Date): string {
  const start = agendaWhen(startsAt);
  const startDay = agendaDay(startsAt);
  const endDay = agendaDay(endsAt);
  const sameDay =
    startDay.year === endDay.year && startDay.month === endDay.month && startDay.day === endDay.day;
  if (!sameDay) return `${start} alle ${agendaWhen(endsAt)}`;
  const endClock = new Intl.DateTimeFormat("it-IT", {
    timeZone: rome,
    hour: "2-digit",
    minute: "2-digit",
  }).format(asDate(endsAt));
  return `${start} alle ${endClock}`;
}

export function agendaLocalInput(value: string | Date): string {
  const parts = romeParts(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function movedAppointment(
  appointmentId: string,
  row: { id: string } | null,
  error: unknown,
  startsAtLocal: string,
  endsAtLocal: string,
): { ok: true; id: string; startsAt: string; endsAt: string } | { ok: false; error: string } {
  const id = appointmentId.trim();
  const startsAt = romeInstant(startsAtLocal);
  const endsAt = romeInstant(endsAtLocal);
  if (!id || error || !row || row.id !== id || !startsAt || !endsAt || endsAt <= startsAt) {
    return { ok: false, error: "Controlla gli orari dell'appuntamento." };
  }
  return { ok: true, id, startsAt, endsAt };
}

export function agendaDay(value: string | Date): { year: number; month: number; day: number } {
  const parts = romeParts(value);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function romeWindow(
  startsAtLocal: string,
  endsAtLocal: string,
): { ok: true; startsAt: string; endsAt: string } | { ok: false; error: string } {
  const startsAt = romeInstant(startsAtLocal);
  const endsAt = romeInstant(endsAtLocal);
  if (!startsAt || !endsAt || endsAt <= startsAt) {
    return { ok: false, error: "Controlla titolo, cliente e orari." };
  }
  return { ok: true, startsAt, endsAt };
}

export function romeInstant(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  let instant = Date.UTC(year, month - 1, day, hour, minute);
  for (let pass = 0; pass < 2; pass += 1) {
    const shown = romeParts(new Date(instant));
    const delta =
      Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute) -
      Date.UTC(year, month - 1, day, hour, minute);
    instant -= delta;
  }
  const shown = romeParts(new Date(instant));
  if (
    shown.year !== year ||
    shown.month !== month ||
    shown.day !== day ||
    shown.hour !== hour ||
    shown.minute !== minute
  ) {
    return null;
  }
  return new Date(instant).toISOString();
}

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  clientName: string;
  placeLabel: string;
  address: string | null;
  includeAddress: boolean;
  notes?: string;
  preferences?: string;
  revisedAt?: string | Date;
  sequence?: number;
  cancelled?: boolean;
};

export function compactMonth(marks: string[], now: Date): { label: string; days: number[] } {
  const dated = marks
    .map((value) => ({ value, day: agendaDay(value) }))
    .filter((item) => !Number.isNaN(new Date(item.value).getTime()))
    .sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());
  const focus = dated[0]?.day ?? agendaDay(now);
  const days = [
    ...new Set(
      dated
        .filter((item) => item.day.year === focus.year && item.day.month === focus.month)
        .map((item) => item.day.day),
    ),
  ].sort((a, b) => a - b);
  const label = new Date(Date.UTC(focus.year, focus.month - 1, 15, 12)).toLocaleDateString("it-IT", {
    timeZone: "Europe/Rome",
    month: "long",
    year: "numeric",
  });
  return { label: label.replace(/\s+/g, " "), days };
}

export function agendaPlaceLabel(clientName: string, label: string): string {
  const name = clientName.trim();
  const place = label.trim();
  if (name && place) return `${name}, ${place}`;
  return name || place;
}

export function placeForAppointment(
  placeId: string,
  clientId: string,
  row: { id: string; client_id: string } | null,
  error: unknown,
): { ok: true; placeId: string | null } | { ok: false; error: string } {
  const id = placeId.trim();
  if (!id) return { ok: true, placeId: null };
  if (error || !row || row.id !== id || row.client_id !== clientId) {
    return { ok: false, error: "Il luogo non appartiene a questo cliente." };
  }
  return { ok: true, placeId: id };
}

export function upcomingAppointments<T extends { ends_at: string | Date; status: string }>(
  rows: T[],
  now: Date,
): T[] {
  const cutoff = now.getTime();
  return rows.filter((row) => {
    if (row.status === "annullato") return false;
    const end = row.ends_at instanceof Date ? row.ends_at.getTime() : new Date(row.ends_at).getTime();
    return end >= cutoff;
  });
}

function plain(value: string): string {
  return value.replace(/[\r\n]+/g, "");
}

function stamp(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  const iso = Number.isNaN(parsed.getTime())
    ? plain(typeof value === "string" ? value : "")
    : parsed.toISOString();
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string): string[] {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return [line];
  const parts: string[] = [];
  let offset = 0;
  let width = 75;
  while (offset < bytes.length) {
    let end = Math.min(offset + width, bytes.length);
    if (end < bytes.length) {
      while (end > offset && (bytes[end] & 0xc0) === 0x80) end -= 1;
      if (end === offset) end = Math.min(offset + width, bytes.length);
    }
    const chunk = bytes.subarray(offset, end).toString("utf8");
    parts.push(parts.length === 0 ? chunk : ` ${chunk}`);
    offset = end;
    width = 74;
  }
  return parts;
}

export function buildIcs(events: CalendarEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elleboro Giardini//Agenda//IT",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    const where = [event.clientName, event.placeLabel, event.includeAddress ? event.address : ""]
      .map((part) => (part ?? "").trim())
      .filter(Boolean);
    const sequence = Number.isInteger(event.sequence) && (event.sequence ?? 0) >= 0 ? event.sequence : null;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${plain(event.id)}@elleboro`,
      `DTSTAMP:${stamp(event.revisedAt ?? event.startsAt)}`,
      ...(sequence === null ? [] : [`SEQUENCE:${sequence}`]),
      `DTSTART:${stamp(event.startsAt)}`,
      `DTEND:${stamp(event.endsAt)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `LOCATION:${escapeText(where.join(", "))}`,
      ...(event.cancelled ? ["STATUS:CANCELLED"] : []),
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.flatMap(foldLine).join("\r\n");
}
