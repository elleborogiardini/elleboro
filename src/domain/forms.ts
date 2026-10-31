import { z } from "zod";
import { mailHref } from "@/domain/card";

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function actionNotice(message: string | undefined): string | null {
  const text = message?.trim();
  return text ? text : null;
}

export function noticeField(message: string | undefined): string | null {
  switch (actionNotice(message)) {
    case "Scrivi il nome.":
      return "owner_name";
    case "Scrivi il nome dell'attività.":
      return "hero_title";
    case "Scrivi una frase breve.":
    case "La frase sta in venti parole.":
      return "hero_lead";
    case "Scrivi chi sei.":
      return "bio";
    case "Scrivi un numero, oppure lascialo vuoto.":
      return "contact_phone";
    case "Scrivi una mail, oppure lasciala vuota.":
      return "contact_email";
    case "Scrivi il testo alternativo.":
      return "portrait_alt";
    case "Ogni passo ha un titolo e una frase.":
      return "services";
    default:
      return null;
  }
}

export function clientField(
  message: string | undefined,
): "full_name" | "phone" | "email" | null {
  switch (actionNotice(message)) {
    case "Scrivi il nome.":
      return "full_name";
    case "Scrivi un numero, oppure lascialo vuoto.":
      return "phone";
    case "Scrivi una mail, oppure lasciala vuota.":
      return "email";
    default:
      return null;
  }
}

export function noteField(message: string | undefined): "title" | null {
  return actionNotice(message) === "Scrivi il titolo della nota." ? "title" : null;
}

export function notedError(path: string, noteId: string, message: string): string {
  const url = new URL(path, "http://local");
  const id = noteId.trim();
  if (id) url.searchParams.set("nota", id);
  url.searchParams.set("errore", message);
  return `${url.pathname}${url.search}`;
}

export function quotedError(path: string, quoteId: string, message: string): string {
  const url = new URL(path, "http://local");
  const id = quoteId.trim();
  if (id) url.searchParams.set("voce", id);
  url.searchParams.set("errore", message);
  return `${url.pathname}${url.search}`;
}

export function movedError(path: string, appointmentId: string, message: string): string {
  const url = new URL(path, "http://local");
  const id = appointmentId.trim();
  if (id) url.searchParams.set("sposta", id);
  url.searchParams.set("errore", message);
  return `${url.pathname}${url.search}`;
}

export function photoError(path: string, photoId: string, message: string): string {
  const url = new URL(path, "http://local");
  const id = photoId.trim();
  if (id) url.searchParams.set("foto", id);
  url.searchParams.set("errore", message);
  return `${url.pathname}${url.search}`;
}

export function agendaField(message: string | undefined): "title" | "move" | null {
  const text = actionNotice(message);
  if (text === "Controlla titolo, cliente e orari.") return "title";
  if (text === "Controlla gli orari dell'appuntamento.") return "move";
  return null;
}

export function preferenceField(message: string | undefined): "pref_category" | null {
  return actionNotice(message) === "Scegli una categoria valida." ? "pref_category" : null;
}

export function dossierField(
  message: string | undefined,
): "label" | "title" | "alt" | "date" | null {
  const text = actionNotice(message);
  if (text === "Dai un nome al luogo.") return "label";
  if (text === "Scrivi cosa hai fatto.") return "title";
  if (text === "Scrivi il testo alternativo.") return "alt";
  if (text === "Scrivi una data valida.") return "date";
  return null;
}

export function quoteField(message: string | undefined): "author" | "quote" | null {
  const text = actionNotice(message);
  if (text === "Nell'attribuzione non usare il trattino lungo.") return "author";
  if (text === "Servono citazione, nome e contesto.") return "quote";
  return null;
}

export function inquiryField(
  message: string | undefined,
): "name" | "contact" | "place" | "need" | "message" | null {
  switch (actionNotice(message)) {
    case "Scrivi il nome.":
      return "name";
    case "Scrivi un telefono o una mail.":
      return "contact";
    case "Scegli il tipo di luogo.":
      return "place";
    case "Scegli cosa serve.":
      return "need";
    case "Scrivi il messaggio.":
      return "message";
    default:
      return null;
  }
}

export function fieldInvalid(message: string | undefined): "field-invalid" | "" {
  return actionNotice(message) ? "field-invalid" : "";
}

function read<T>(schema: z.ZodType<T>, input: unknown, error: string): Parsed<T> {
  const result = schema.safeParse(input);
  if (!result.success) return { ok: false, error };
  return { ok: true, value: result.data };
}

const clientSchema = z.object({
  fullName: z.string().trim().min(1),
  phone: z.string().trim(),
  email: z.string().trim(),
  address: z.string().trim(),
  locality: z.string().trim(),
});

const placeSchema = z.object({
  label: z.string().trim().min(1),
  kind: z.enum(["giardino", "balcone", "terrazzo", "interno", "altro"]),
});

const noteSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string(),
});

const preferenceSchema = z.object({
  category: z.enum(["fiore", "colore", "pianta", "evitare", "altro"]),
  label: z.string().trim().min(1),
});

const appointmentSchema = z
  .object({
    title: z.string().trim().min(1),
    clientId: z.string().trim().min(1),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    includeAddress: z.boolean(),
  })
  .refine((value) => {
    const start = new Date(value.startsAt).getTime();
    const end = new Date(value.endsAt).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && end > start;
  });

const inquirySchema = z.object({
  name: z.string().trim().min(1),
  contact: z.string().trim().min(1),
  placeKind: z.enum(["giardino", "balcone", "terrazzo", "altro"]),
  need: z.enum(["progetto", "cura", "entrambi"]),
  area: z.string().trim(),
  message: z.string().trim().min(1),
});

const testimonialSchema = z.object({
  quote: z.string().trim().min(1),
  author: z.string().trim().min(1),
  context: z.string().trim().min(1),
});

export function parseClient(input: z.input<typeof clientSchema>): Parsed<z.output<typeof clientSchema>> {
  const parsed = read(clientSchema, input, "Scrivi il nome.");
  if (!parsed.ok) return parsed;
  if (parsed.value.phone && !/\d/.test(parsed.value.phone)) {
    return { ok: false, error: "Scrivi un numero, oppure lascialo vuoto." };
  }
  if (parsed.value.email && !mailHref(parsed.value.email)) {
    return { ok: false, error: "Scrivi una mail, oppure lasciala vuota." };
  }
  return parsed;
}

const interventionSchema = z.object({
  title: z.string().trim().min(1),
});

const appointmentStatusSchema = z.enum(["previsto", "fatto", "annullato"]);

export function parseIntervention(input: {
  title: string;
}): Parsed<z.output<typeof interventionSchema>> {
  return read(interventionSchema, input, "Scrivi cosa hai fatto.");
}

export function parsePublishAlt(alt: string): Parsed<string> {
  return read(z.string().trim().min(1), alt, "Scrivi il testo alternativo.");
}

export function parseAppointmentStatus(
  status: string,
): Parsed<z.output<typeof appointmentStatusSchema>> {
  return read(appointmentStatusSchema, status, "Stato non valido.");
}

export function parsePlace(input: { label: string; kind: string }): Parsed<z.output<typeof placeSchema>> {
  return read(placeSchema, input, "Dai un nome al luogo.");
}

export function parseSiteEmail(email: string): Parsed<string | null> {
  const value = email.trim();
  if (!value) return { ok: true, value: null };
  if (!mailHref(value)) return { ok: false, error: "Scrivi una mail, oppure lasciala vuota." };
  return { ok: true, value };
}

export function parseSitePhone(phone: string): Parsed<string | null> {
  const trimmed = phone.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/\d/.test(trimmed)) {
    return { ok: false, error: "Scrivi un numero, oppure lascialo vuoto." };
  }
  return { ok: true, value: trimmed };
}

export function parseNote(input: z.input<typeof noteSchema>): Parsed<z.output<typeof noteSchema>> {
  return read(noteSchema, input, "Scrivi il titolo della nota.");
}

export function parsePreference(input: {
  category: string;
  label: string;
}): Parsed<z.output<typeof preferenceSchema>> {
  return read(preferenceSchema, input, "Scegli una categoria valida.");
}

export function parseAppointment(
  input: z.input<typeof appointmentSchema>,
): Parsed<z.output<typeof appointmentSchema>> {
  return read(appointmentSchema, input, "Controlla titolo, cliente e orari.");
}

export function parseInquiry(input: {
  name: string;
  contact: string;
  placeKind: string;
  need: string;
  area: string;
  message: string;
}): Parsed<z.output<typeof inquirySchema>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Scrivi il nome." };
  const contact = input.contact.trim();
  const digits = contact.replace(/\D/g, "");
  if (!mailHref(contact) && digits.length < 6) {
    return { ok: false, error: "Scrivi un telefono o una mail." };
  }
  const placeKind = z.enum(["giardino", "balcone", "terrazzo", "altro"]).safeParse(input.placeKind);
  if (!placeKind.success) return { ok: false, error: "Scegli il tipo di luogo." };
  const need = z.enum(["progetto", "cura", "entrambi"]).safeParse(input.need);
  if (!need.success) return { ok: false, error: "Scegli cosa serve." };
  const message = input.message.trim();
  if (!message) return { ok: false, error: "Scrivi il messaggio." };
  return {
    ok: true,
    value: {
      name,
      contact,
      placeKind: placeKind.data,
      need: need.data,
      area: input.area.trim(),
      message,
    },
  };
}

const inquiryStatusSchema = z.enum(["nuova", "in corso", "chiusa"]);

export function parseInquiryStatus(status: string): Parsed<z.output<typeof inquiryStatusSchema>> {
  return read(inquiryStatusSchema, status, "Stato non valido.");
}

export function parseRequiredLine(value: string, error: string): Parsed<string> {
  const line = value.trim();
  if (!line) return { ok: false, error };
  return { ok: true, value: line };
}

const serviceStepSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export function parseServices(
  steps: { title: string; body: string }[],
): Parsed<{ title: string; body: string }[]> {
  if (steps.length !== 3) return { ok: false, error: "Ogni passo ha un titolo e una frase." };
  const value: { title: string; body: string }[] = [];
  for (const step of steps) {
    const parsed = serviceStepSchema.safeParse(step);
    if (!parsed.success) return { ok: false, error: "Ogni passo ha un titolo e una frase." };
    value.push(parsed.data);
  }
  return { ok: true, value };
}

export function parseHeroLead(value: string): Parsed<string> {
  const lead = value.trim();
  const words = lead.split(/\s+/).filter(Boolean);
  if (!lead) return { ok: false, error: "Scrivi una frase breve." };
  if (words.length > 20) return { ok: false, error: "La frase sta in venti parole." };
  return { ok: true, value: lead };
}

export function parseTestimonial(
  input: z.input<typeof testimonialSchema>,
): Parsed<z.output<typeof testimonialSchema>> {
  const parsed = read(testimonialSchema, input, "Servono citazione, nome e contesto.");
  if (!parsed.ok) return parsed;
  if (parsed.value.author.includes("—") || parsed.value.context.includes("—")) {
    return { ok: false, error: "Nell'attribuzione non usare il trattino lungo." };
  }
  return parsed;
}
