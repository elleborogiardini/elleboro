export type PlaceKind = "giardino" | "balcone" | "terrazzo" | "altro";
export type Need = "progetto" | "cura" | "entrambi";

export type InquiryDraft = {
  name: string;
  contact: string;
  placeKind: PlaceKind;
  need: Need;
  area: string;
  message: string;
  company: string;
  startedAt: number;
};

export type InquiryRecord = {
  name: string;
  contact: string;
  placeKind: PlaceKind;
  need: Need;
  area: string;
  message: string;
};

const MIN_MS = 3_000;
const MAX_PER_WINDOW = 5;

export function reviewInquiry(
  draft: InquiryDraft,
  now: number,
  recentCount: number,
): { ok: true; inquiry: InquiryRecord } | { ok: false; error: string } {
  if (draft.company.trim()) return { ok: false, error: "Richiesta non inviata." };
  if (!Number.isFinite(draft.startedAt) || draft.startedAt <= 0 || now - draft.startedAt < MIN_MS) {
    return { ok: false, error: "Attendi un momento e riprova." };
  }
  if (recentCount >= MAX_PER_WINDOW) {
    return { ok: false, error: "Troppe richieste. Riprova più tardi." };
  }
  if (!draft.name.trim() || !draft.contact.trim() || !draft.message.trim()) {
    return { ok: false, error: "Compila nome, contatto e messaggio." };
  }
  return {
    ok: true,
    inquiry: {
      name: draft.name.trim(),
      contact: draft.contact.trim(),
      placeKind: draft.placeKind,
      need: draft.need,
      area: draft.area.trim(),
      message: draft.message.trim(),
    },
  };
}

export function throttleMark(error: unknown): { ok: true } | { ok: false; error: string } {
  if (error) return { ok: false, error: "Troppe richieste. Riprova più tardi." };
  return { ok: true };
}

export function recentInquiryCount(count: number | null, error: unknown): number | null {
  if (error || count === null) return null;
  return count;
}

export function inquiryOpenStamp(existing: string | undefined, now: number): string {
  const opened = Number(existing);
  if (Number.isFinite(opened) && opened > 0 && opened <= now) return String(opened);
  return String(now);
}

export function inquiryStatusChoices(current: string): { value: string; label: string; pressed: boolean }[] {
  return [
    { value: "nuova", label: "Nuova" },
    { value: "in corso", label: "In corso" },
    { value: "chiusa", label: "Chiusa" },
  ].map((choice) => ({ ...choice, pressed: choice.value === current }));
}

export function emptyInquiries(): string {
  return "Nessuna richiesta. Arrivano da /richiesta.";
}

const placeWords: Record<string, string> = {
  giardino: "Giardino",
  balcone: "Balcone",
  terrazzo: "Terrazzo",
  altro: "Altro",
};

const needWords: Record<string, string> = {
  progetto: "Progetto",
  cura: "Cura",
  entrambi: "Progetto e cura",
};

const statusWords: Record<string, string> = {
  nuova: "Nuova",
  "in corso": "In corso",
  chiusa: "Chiusa",
};

function word(table: Record<string, string>, value: string): string {
  return table[value] ?? value;
}

export function inquirySummary(input: {
  area: string | null;
  placeKind: string;
  status: string;
}): string {
  return [input.area?.trim(), word(placeWords, input.placeKind), word(statusWords, input.status)]
    .filter(Boolean)
    .join(", ");
}

export function inquiryFacts(input: {
  placeKind: string;
  need: string;
  area: string | null;
}): string {
  return [word(placeWords, input.placeKind), word(needWords, input.need), input.area?.trim()]
    .filter(Boolean)
    .join(", ");
}
