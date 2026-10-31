export function activeClients<T extends { archivedAt: string | null }>(rows: T[]): T[] {
  return rows.filter((row) => row.archivedAt === null);
}

export function archivedIntervention(
  interventionId: string,
  clientId: string,
  row: { id: string; client_id: string } | null,
  error: unknown,
): { ok: true; id: string } | { ok: false; error: string } {
  const id = interventionId.trim();
  if (!id || error || !row || row.id !== id || row.client_id !== clientId) {
    return { ok: false, error: "L'intervento non appartiene a questo cliente." };
  }
  return { ok: true, id };
}

export function preferenceOnClient(
  preferenceId: string,
  clientId: string,
  row: { id: string; client_id: string } | null,
  error: unknown,
): { ok: true } | { ok: false; error: string } {
  const id = preferenceId.trim();
  if (!id || error || !row || row.id !== id || row.client_id !== clientId) {
    return { ok: false, error: "Questa preferenza non è di questo cliente." };
  }
  return { ok: true };
}

export function noteOnClient(
  noteId: string,
  clientId: string,
  row: { id: string; client_id: string } | null,
  error: unknown,
): { ok: true } | { ok: false; error: string } {
  const id = noteId.trim();
  if (!id) return { ok: true };
  if (error || !row || row.id !== id || row.client_id !== clientId) {
    return { ok: false, error: "Le note sono riservate al proprietario." };
  }
  return { ok: true };
}

export function mapsDirections(
  role: "owner" | "technician" | null,
  client: { address: string | null; locality: string | null },
): string | null {
  if (role !== "owner") return null;
  const street = (client.address ?? "").replace(/[\r\n]+/g, " ").trim();
  if (!street) return null;
  const locality = (client.locality ?? "").replace(/[\r\n]+/g, " ").trim();
  const destination = locality ? `${street}, ${locality}` : street;
  return `maps://?daddr=${encodeURIComponent(destination)}&dirflg=d`;
}

export function clientLine(client: {
  locality: string | null;
  phone: string | null;
  address?: string | null;
}): string {
  return [client.locality, client.phone].filter(Boolean).join(", ");
}

const placeKinds: Record<string, string> = {
  giardino: "Giardino",
  balcone: "Balcone",
  terrazzo: "Terrazzo",
  interno: "Interno",
  altro: "Altro",
};

export function placeKindLabel(kind: string): string {
  return placeKinds[kind] ?? kind;
}

const preferenceCategories: Record<string, string> = {
  fiore: "Fiore",
  colore: "Colore",
  pianta: "Pianta",
  evitare: "Da evitare",
  altro: "Altro",
};

export function preferenceCategoryLabel(category: string): string {
  return preferenceCategories[category] ?? category;
}

export function clientListEmpty(query: string): string {
  if (query.trim()) return "Nessun cliente con questa ricerca. Aggiungine uno qui sotto.";
  return "Nessun cliente ancora. Il primo si aggiunge qui sotto.";
}

export function clientsMatching<
  T extends {
    full_name: string;
    phone: string | null;
    locality: string | null;
    archivedAt: string | null;
  },
>(rows: T[], query: string): T[] {
  const needle = query.trim().replace(/[%_,]/g, "").toLocaleLowerCase("it");
  const needleDigits = needle.replace(/\D/g, "");
  return rows.filter((row) => {
    if (row.archivedAt !== null) return false;
    if (!needle) return true;
    const haystack = [row.full_name, row.phone ?? "", row.locality ?? ""]
      .join(" ")
      .toLocaleLowerCase("it");
    if (haystack.includes(needle)) return true;
    const national = needleDigits.startsWith("0039")
      ? needleDigits.slice(4)
      : needleDigits.startsWith("39")
        ? needleDigits.slice(2)
        : needleDigits;
    const comparable = national.length >= 6 ? national : needleDigits;
    if (comparable.length < 3) return false;
    return (row.phone ?? "").replace(/\D/g, "").includes(comparable);
  });
}

export function interventionForClient(
  interventionId: string,
  clientId: string,
  row: { id: string; client_id: string } | null,
  error: unknown,
): { ok: true; interventionId: string | null } | { ok: false; error: string } {
  const id = interventionId.trim();
  if (!id) return { ok: true, interventionId: null };
  if (error || !row || row.id !== id || row.client_id !== clientId) {
    return { ok: false, error: "L'intervento non appartiene a questo cliente." };
  }
  return { ok: true, interventionId: id };
}

export function photosByPlace<T extends { placeId: string | null }>(
  places: { id: string; label: string }[],
  photos: T[],
): { id: string; label: string; photos: T[] }[] {
  return places.map((place) => ({
    id: place.id,
    label: place.label,
    photos: photos.filter((photo) => photo.placeId === place.id),
  }));
}

export function privatePhoto(clientId: string, fileName: string) {
  return { bucket: "private" as const, path: `${clientId}/${fileName}` };
}

export function unrecordedPrivateFile(insertError: unknown, storagePath: string): string | null {
  if (!insertError) return null;
  return storagePath;
}

export function unpublishedPublicFile(insertError: unknown, publicPath: string): string | null {
  if (!insertError) return null;
  return publicPath;
}

export function publishedWork(input: {
  path: string;
  alt: string;
  caption: string | null;
  clientId?: string;
}) {
  return { path: input.path, alt: input.alt, caption: input.caption };
}

export function leftoverIntervention(updateError: unknown, interventionId: string): string | null {
  if (!updateError) return null;
  return interventionId;
}

export function appointmentReadable<T>(row: T | null, error: unknown): row is T {
  return !error && row !== null;
}

export function appointmentDoneUpdate(
  interventionId: string | null,
): { status: "fatto"; intervention_id: string } | null {
  if (!interventionId) return null;
  return { status: "fatto", intervention_id: interventionId };
}

export function interventionFromAppointment(input: {
  title: string;
  clientId: string;
  startsAt: string;
  interventionId: string | null;
  status: string;
  placeId?: string | null;
}): { title: string; clientId: string; happenedOn: string; placeId: string | null } | null {
  if (input.status !== "fatto" || input.interventionId) return null;
  const placeId = input.placeId?.trim() ? input.placeId.trim() : null;
  return {
    title: input.title,
    clientId: input.clientId,
    happenedOn: romeDay(input.startsAt),
    placeId,
  };
}

function calendarDay(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function interventionDay(written: string, now: Date): string | null {
  const trimmed = written.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return calendarDay(trimmed) ? trimmed : null;
  return romeDay(now.toISOString());
}

export function interventionWhen(day: string): string {
  const trimmed = day.trim();
  const match = calendarDay(trimmed);
  if (!match) return trimmed;
  const date = new Date(Date.UTC(match.year, match.month - 1, match.day, 12));
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function romeDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
