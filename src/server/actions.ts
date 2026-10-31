"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { movedAppointment, placeForAppointment, romeWindow } from "@/domain/calendar";
import { workVisibility } from "@/domain/public-page";
import { appointmentDoneUpdate, appointmentReadable, archivedIntervention, interventionDay, interventionForClient, interventionFromAppointment, leftoverIntervention, noteOnClient, preferenceOnClient, privatePhoto, publishedWork, unpublishedPublicFile, unrecordedPrivateFile } from "@/domain/dossier";
import {
  parseAppointment,
  parseAppointmentStatus,
  parseClient,
  parseInquiry,
  parseInquiryStatus,
  parseIntervention,
  parseNote,
  parsePlace,
  parseHeroLead,
  parsePreference,
  parsePublishAlt,
  parseRequiredLine,
  parseServices,
  parseSiteEmail,
  parseSitePhone,
  parseTestimonial,
  notedError,
  quotedError,
  movedError,
  photoError,
} from "@/domain/forms";
import { stripPrivateExif } from "@/domain/photo";
import { safeReturn } from "@/domain/shell";
import { recentInquiryCount, reviewInquiry, throttleMark, type Need, type PlaceKind } from "@/domain/inquiry";
import { createAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?errore=${encodeURIComponent(message)}`);
}

function bail(formData: FormData, message: string): never {
  const explicit = safeReturn(text(formData, "return_to"));
  const clientTarget = safeReturn(`/app/clienti/${text(formData, "client_id")}`);
  fail(explicit || clientTarget || "/app", message);
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) fail("/app", "Collega il progetto prima di salvare.");
  const client = parseClient({
    fullName: text(formData, "full_name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    locality: text(formData, "locality"),
  });
  if (!client.ok) fail("/app", client.error);
  const { data, error } = await supabase
    .from("clients")
    .insert({
      full_name: client.value.fullName,
      phone: client.value.phone || null,
      email: client.value.email || null,
      address: client.value.address || null,
      locality: client.value.locality || null,
    })
    .select("id")
    .single();
  if (error || !data) fail("/app", "Non sono riuscito a salvare il cliente.");
  redirect(`/app/clienti/${data.id}`);
}

export async function updateClientAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const id = text(formData, "id");
  const client = parseClient({
    fullName: text(formData, "full_name"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    address: text(formData, "address"),
    locality: text(formData, "locality"),
  });
  if (!client.ok) fail(`/app/clienti/${id}`, client.error);
  const { error } = await supabase
    .from("clients")
    .update({
      full_name: client.value.fullName,
      phone: client.value.phone || null,
      email: client.value.email || null,
      address: client.value.address || null,
      locality: client.value.locality || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) fail(`/app/clienti/${id}`, "Non sono riuscito ad aggiornare.");
  revalidatePath(`/app/clienti/${id}`);
}

export async function archiveClientAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const id = text(formData, "id");
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) bail(formData, "Non sono riuscito ad archiviare.");
  redirect("/app");
}

export async function createPlaceAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const place = parsePlace({
    label: text(formData, "label"),
    kind: text(formData, "kind") || "giardino",
  });
  if (!place.ok) bail(formData, place.error);
  const { error } = await supabase.from("places").insert({
    client_id: clientId,
    kind: place.value.kind,
    label: place.value.label,
    notes: text(formData, "notes") || null,
  });
  if (error) bail(formData, "Non sono riuscito a salvare il luogo.");
  revalidatePath(`/app/clienti/${clientId}`);
  }

export async function createInterventionAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const intervention = parseIntervention({ title: text(formData, "title") });
  if (!intervention.ok) bail(formData, intervention.error);
  const requestedPlace = text(formData, "place_id");
  const placeRow = requestedPlace
    ? await supabase.from("places").select("id, client_id").eq("id", requestedPlace).maybeSingle()
    : { data: null, error: null };
  const place = placeForAppointment(requestedPlace, clientId, placeRow.data, placeRow.error);
  if (!place.ok) bail(formData, place.error);
  const happenedOn = interventionDay(text(formData, "happened_on"), new Date());
  if (!happenedOn) bail(formData, "Scrivi una data valida.");
  const { error } = await supabase.from("interventions").insert({
    client_id: clientId,
    place_id: place.placeId,
    happened_on: happenedOn,
    title: intervention.value.title,
    notes: text(formData, "notes") || null,
  });
  if (error) bail(formData, "Non sono riuscito a salvare l'intervento.");
  revalidatePath(`/app/clienti/${clientId}`);
  }

export async function archiveInterventionAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const id = text(formData, "id");
  const existing = await supabase.from("interventions").select("id, client_id").eq("id", id).maybeSingle();
  const owned = archivedIntervention(id, clientId, existing.data, existing.error);
  if (!owned.ok) bail(formData, owned.error);
  const { error } = await supabase
    .from("interventions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", owned.id)
    .eq("client_id", clientId);
  if (error) bail(formData, "Non sono riuscito ad archiviare l'intervento.");
  revalidatePath(`/app/clienti/${clientId}`);
}

export async function savePrivateAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const specifics = String(formData.get("specifics") ?? "");
  const label = text(formData, "pref_label");
  const preference = label
    ? parsePreference({
        category: text(formData, "pref_category") || "fiore",
        label,
      })
    : null;
  if (preference && !preference.ok) bail(formData, preference.error);
  const { error } = await supabase.from("client_private").upsert({
    client_id: clientId,
    specifics,
    updated_at: new Date().toISOString(),
  });
  if (error) bail(formData, "Queste note sono riservate al proprietario.");
  if (preference) {
    const { error: preferenceError } = await supabase.from("preferences").insert({
      client_id: clientId,
      category: preference.value.category,
      label: preference.value.label,
      note: text(formData, "pref_note") || null,
    });
    if (preferenceError) bail(formData, "Queste note sono riservate al proprietario.");
  }
  revalidatePath(`/app/clienti/${clientId}/preferenze`);
  }

export async function removePreferenceAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const id = text(formData, "id");
  const existing = id
    ? await supabase.from("preferences").select("id, client_id").eq("id", id).maybeSingle()
    : { data: null, error: null };
  const owned = preferenceOnClient(id, clientId, existing.data, existing.error);
  if (!owned.ok) bail(formData, owned.error);
  const { error } = await supabase.from("preferences").delete().eq("id", id).eq("client_id", clientId);
  if (error) bail(formData, "Queste note sono riservate al proprietario.");
  revalidatePath(`/app/clienti/${clientId}/preferenze`);
}

export async function saveNoteAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const id = text(formData, "id");
  const existing = id
    ? await supabase.from("note_sections").select("id, client_id").eq("id", id).maybeSingle()
    : { data: null, error: null };
  const owned = noteOnClient(id, clientId, existing.data, existing.error);
  if (!owned.ok) bail(formData, owned.error);
  const note = parseNote({
    title: text(formData, "title"),
    body: String(formData.get("body") ?? ""),
  });
  if (!note.ok) {
    const back = safeReturn(text(formData, "return_to")) || `/app/clienti/${clientId}/note`;
    redirect(notedError(back, id, note.error));
  }
  const payload = { title: note.value.title, body: note.value.body, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from("note_sections").update(payload).eq("id", id).eq("client_id", clientId)
    : await supabase.from("note_sections").insert({ ...payload, client_id: clientId });
  if (error) bail(formData, "Le note sono riservate al proprietario.");
  revalidatePath(`/app/clienti/${clientId}/note`);
  }

export async function archiveNoteAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const id = text(formData, "id");
  if (!id) bail(formData, "Le note sono riservate al proprietario.");
  const existing = await supabase.from("note_sections").select("id, client_id").eq("id", id).maybeSingle();
  const owned = noteOnClient(id, clientId, existing.data, existing.error);
  if (!owned.ok) bail(formData, owned.error);
  const { error } = await supabase
    .from("note_sections")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("client_id", clientId);
  if (error) bail(formData, "Le note sono riservate al proprietario.");
  revalidatePath(`/app/clienti/${clientId}/note`);
}

export async function createAppointmentAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const appointment = parseAppointment({
    title: text(formData, "title"),
    clientId: text(formData, "client_id"),
    startsAt: text(formData, "starts_at"),
    endsAt: text(formData, "ends_at"),
    includeAddress: formData.get("include_address") === "on",
  });
  if (!appointment.ok) bail(formData, appointment.error);
  const scheduled = romeWindow(appointment.value.startsAt, appointment.value.endsAt);
  if (!scheduled.ok) bail(formData, scheduled.error);
  const requestedPlace = text(formData, "place_id");
  const placeRow = requestedPlace
    ? await supabase.from("places").select("id, client_id").eq("id", requestedPlace).maybeSingle()
    : { data: null, error: null };
  const place = placeForAppointment(
    requestedPlace,
    appointment.value.clientId,
    placeRow.data,
    placeRow.error,
  );
  if (!place.ok) bail(formData, place.error);
  const { error } = await supabase.from("appointments").insert({
    title: appointment.value.title,
    client_id: appointment.value.clientId,
    place_id: place.placeId,
    starts_at: scheduled.startsAt,
    ends_at: scheduled.endsAt,
    include_address: appointment.value.includeAddress,
  });
  if (error) bail(formData, "L'agenda è riservata al proprietario.");
  revalidatePath("/app/agenda");
  }

export async function moveAppointmentAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const id = text(formData, "id");
  const current = await supabase.from("appointments").select("id").eq("id", id).maybeSingle();
  const moved = movedAppointment(
    id,
    current.data,
    current.error,
    text(formData, "starts_at"),
    text(formData, "ends_at"),
  );
  if (!moved.ok) {
    const back = safeReturn(text(formData, "return_to")) || "/app/agenda";
    redirect(movedError(back, id, moved.error));
  }
  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: moved.startsAt,
      ends_at: moved.endsAt,
    })
    .eq("id", moved.id);
  if (error) bail(formData, "L'agenda è riservata al proprietario.");
  revalidatePath("/app/agenda");
}

export async function setAppointmentStatusAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const id = text(formData, "id");
  const nextStatus = parseAppointmentStatus(text(formData, "status"));
  if (!nextStatus.ok) bail(formData, nextStatus.error);
  const status = nextStatus.value;
  if (status === "fatto") {
    const { data: current, error: readError } = await supabase
      .from("appointments")
      .select("id, title, client_id, starts_at, intervention_id, place_id")
      .eq("id", id)
      .maybeSingle();
    if (!appointmentReadable(current, readError)) {
      bail(formData, "Non sono riuscito a registrare l'intervento.");
    }
    const draft = current
      ? interventionFromAppointment({
          title: current.title,
          clientId: current.client_id,
          startsAt: String(current.starts_at),
          interventionId: current.intervention_id,
          status: "fatto",
          placeId: current.place_id,
        })
      : null;
    if (draft) {
      const { data: created, error: insertError } = await supabase
        .from("interventions")
        .insert({
          client_id: draft.clientId,
          title: draft.title,
          happened_on: draft.happenedOn,
          place_id: draft.placeId,
        })
        .select("id")
        .single();
      const update = appointmentDoneUpdate(insertError ? null : created?.id ?? null);
      if (!update) bail(formData, "Non sono riuscito a registrare l'intervento.");
      const { error } = await supabase.from("appointments").update(update).eq("id", id);
      const leftover = leftoverIntervention(error, update.intervention_id);
      if (leftover) {
        await supabase.from("interventions").delete().eq("id", leftover);
        bail(formData, "L'agenda è riservata al proprietario.");
      }
      revalidatePath("/app/agenda");
      revalidatePath(`/app/clienti/${draft.clientId}`);
      return;
    }
  }
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) bail(formData, "L'agenda è riservata al proprietario.");
  revalidatePath("/app/agenda");
}

export async function submitInquiryAction(
  _state: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const jar = await cookies();
  const startedAt = Number(jar.get("inquiry_opened")?.value ?? 0);
  const inquiry = parseInquiry({
    name: text(formData, "name"),
    contact: text(formData, "contact"),
    placeKind: text(formData, "place_kind"),
    need: text(formData, "need"),
    area: text(formData, "area"),
    message: text(formData, "message"),
  });
  if (!inquiry.ok) return { error: inquiry.error };
  const result = reviewInquiry(
    {
      name: text(formData, "name"),
      contact: text(formData, "contact"),
      placeKind: text(formData, "place_kind") as PlaceKind,
      need: text(formData, "need") as Need,
      area: text(formData, "area"),
      message: text(formData, "message"),
      company: text(formData, "company"),
      startedAt,
    },
    Date.now(),
    0,
  );
  if (!result.ok) return { error: result.error };
  const admin = createAdmin();
  if (!admin) return { error: "Il modulo non è ancora collegato." };
  const bucket = createHash("sha256")
    .update(text(formData, "contact"))
    .digest("hex");
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("inquiry_throttle")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);
  const recent = recentInquiryCount(count, countError);
  if (recent === null) return { error: "Troppe richieste. Riprova più tardi." };
  const gated = reviewInquiry(
    {
      name: result.inquiry.name,
      contact: result.inquiry.contact,
      placeKind: result.inquiry.placeKind,
      need: result.inquiry.need,
      area: result.inquiry.area,
      message: result.inquiry.message,
      company: "",
      startedAt,
    },
    Date.now(),
    recent,
  );
  if (!gated.ok) return { error: gated.error };
  const marked = throttleMark((await admin.from("inquiry_throttle").insert({ bucket })).error);
  if (!marked.ok) return { error: marked.error };
  const { error } = await admin.from("inquiries").insert({
    name: gated.inquiry.name,
    contact: gated.inquiry.contact,
    place_kind: gated.inquiry.placeKind,
    need: gated.inquiry.need,
    area: gated.inquiry.area,
    message: gated.inquiry.message,
  });
  if (error) return { error: "Non sono riuscito a inviare la richiesta." };
  return { ok: true };
}

export async function setInquiryStatusAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const status = parseInquiryStatus(text(formData, "status"));
  if (!status.ok) bail(formData, status.error);
  const { error } = await supabase
    .from("inquiries")
    .update({ status: status.value })
    .eq("id", text(formData, "id"));
  if (error) bail(formData, "Non sono riuscito ad aggiornare la richiesta.");
  revalidatePath("/app/richieste");
  revalidatePath(`/app/richieste/${text(formData, "id")}`);
}

export async function saveSiteAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const ownerName = parseRequiredLine(text(formData, "owner_name"), "Scrivi il nome.");
  if (!ownerName.ok) bail(formData, ownerName.error);
  const heroTitle = parseRequiredLine(text(formData, "hero_title"), "Scrivi il nome dell'attività.");
  if (!heroTitle.ok) bail(formData, heroTitle.error);
  const lead = parseHeroLead(text(formData, "hero_lead"));
  if (!lead.ok) bail(formData, lead.error);
  const phone = parseSitePhone(text(formData, "contact_phone"));
  if (!phone.ok) bail(formData, phone.error);
  const email = parseSiteEmail(text(formData, "contact_email"));
  if (!email.ok) bail(formData, email.error);
  const portraitAlt = parsePublishAlt(text(formData, "portrait_alt"));
  if (!portraitAlt.ok) bail(formData, portraitAlt.error);
  const services = parseServices(
    [0, 1, 2].map((index) => ({
      title: text(formData, `service_title_${index}`),
      body: text(formData, `service_body_${index}`),
    })),
  );
  if (!services.ok) bail(formData, services.error);
  const bio = parseRequiredLine(text(formData, "bio"), "Scrivi chi sei.");
  if (!bio.ok) bail(formData, bio.error);
  const { error } = await supabase
    .from("site_content")
    .update({
      owner_name: ownerName.value,
      hero_title: heroTitle.value,
      hero_lead: lead.value,
      bio: bio.value,
      contact_phone: phone.value,
      contact_email: email.value,
      service_area: text(formData, "service_area") || null,
      portrait_alt: portraitAlt.value,
      services: services.value,
      published: formData.get("published") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) bail(formData, "Non sono riuscito a salvare il sito.");
  revalidatePath("/");
  revalidatePath("/app/sito");
  }

export async function saveTestimonialAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const id = text(formData, "id");
  const quote = parseTestimonial({
    quote: text(formData, "quote"),
    author: text(formData, "author"),
    context: text(formData, "context"),
  });
  if (!quote.ok) {
    const back = safeReturn(text(formData, "return_to")) || "/app/sito";
    redirect(quotedError(back, id, quote.error));
  }
  const payload = {
    quote: quote.value.quote,
    author: quote.value.author,
    context: quote.value.context,
    visible: formData.get("visible") === "on",
  };
  const { error } = id
    ? await supabase.from("testimonials").update(payload).eq("id", id)
    : await supabase.from("testimonials").insert(payload);
  if (error) bail(formData, "Non sono riuscito a salvare la testimonianza.");
  revalidatePath("/");
  revalidatePath("/app/sito");
  }

export async function uploadPhotoAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const clientId = text(formData, "client_id");
  const requestedPlace = text(formData, "place_id");
  const placeRow = requestedPlace
    ? await supabase.from("places").select("id, client_id").eq("id", requestedPlace).maybeSingle()
    : { data: null, error: null };
  const place = placeForAppointment(requestedPlace, clientId, placeRow.data, placeRow.error);
  if (!place.ok) bail(formData, place.error);
  const requestedIntervention = text(formData, "intervention_id");
  const interventionRow = requestedIntervention
    ? await supabase.from("interventions").select("id, client_id").eq("id", requestedIntervention).maybeSingle()
    : { data: null, error: null };
  const intervention = interventionForClient(
    requestedIntervention,
    clientId,
    interventionRow.data,
    interventionRow.error,
  );
  if (!intervention.ok) bail(formData, intervention.error);
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) bail(formData, "Scegli una foto.");
  const jpeg = await stripPrivateExif(Buffer.from(await file.arrayBuffer()));
  const storagePath = privatePhoto(clientId, `${randomUUID()}.jpg`).path;
  const { error: uploadError } = await supabase.storage
    .from("private")
    .upload(storagePath, jpeg, { contentType: "image/jpeg" });
  if (uploadError) bail(formData, "Non sono riuscito a caricare la foto.");
  const { error: photoError } = await supabase.from("photos").insert({
    client_id: clientId,
    place_id: place.placeId,
    intervention_id: intervention.interventionId,
    storage_path: storagePath,
  });
  const unrecorded = unrecordedPrivateFile(photoError, storagePath);
  if (unrecorded) {
    await supabase.storage.from("private").remove([unrecorded]);
    bail(formData, "Non sono riuscito a registrare la foto.");
  }
  revalidatePath(`/app/clienti/${clientId}`);
  }

export async function publishPhotoAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const photoId = text(formData, "photo_id");
  const alt = parsePublishAlt(text(formData, "alt"));
  if (!alt.ok) {
    const back = safeReturn(text(formData, "return_to")) || `/app/clienti/${text(formData, "client_id")}`;
    redirect(photoError(back, photoId, alt.error));
  }
  const { data: photo } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) bail(formData, "Foto non trovata.");
  const { data: file } = await supabase.storage.from("private").download(photo.storage_path);
  if (!file) bail(formData, "Non riesco a leggere la foto.");
  const publicPath = `${randomUUID()}.jpg`;
  const bytes = await stripPrivateExif(Buffer.from(await file.arrayBuffer()));
  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(publicPath, bytes, { contentType: "image/jpeg" });
  if (uploadError) bail(formData, "Non sono riuscito a pubblicare.");
  const work = publishedWork({
    path: publicPath,
    alt: alt.value,
    caption: text(formData, "caption") || null,
  });
  const { error: itemError } = await supabase.from("portfolio_items").insert({
    public_path: work.path,
    caption: work.caption,
    alt: work.alt,
  });
  const leftover = unpublishedPublicFile(itemError, publicPath);
  if (leftover) {
    await supabase.storage.from("portfolio").remove([leftover]);
    bail(formData, "Non sono riuscito a pubblicare.");
  }
  revalidatePath("/");
  revalidatePath("/app/sito");
  }

export async function uploadPortraitAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const file = formData.get("portrait");
  if (!(file instanceof File) || file.size === 0) bail(formData, "Scegli una foto.");
  const jpeg = await stripPrivateExif(Buffer.from(await file.arrayBuffer()));
  const publicPath = `portrait-${randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("portfolio")
    .upload(publicPath, jpeg, { contentType: "image/jpeg" });
  if (error) bail(formData, "Non sono riuscito a caricare il ritratto.");
  const { error: updateError } = await supabase
    .from("site_content")
    .update({ portrait_path: publicPath, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (updateError) {
    await supabase.storage.from("portfolio").remove([publicPath]);
    bail(formData, "Non sono riuscito a salvare il ritratto.");
  }
  revalidatePath("/");
  revalidatePath("/app/sito");
  }

export async function signOutAction() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

export async function setWorkVisibilityAction(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) bail(formData, "Collega il progetto prima di salvare.");
  const id = text(formData, "id");
  if (!id) bail(formData, "Non sono riuscito ad aggiornare il lavoro.");
  const flag = formData.get("visible");
  const { error } = await supabase
    .from("portfolio_items")
    .update({ published: workVisibility(typeof flag === "string" ? flag : null) })
    .eq("id", id);
  if (error) bail(formData, "Non sono riuscito ad aggiornare il lavoro.");
  revalidatePath("/");
  revalidatePath("/app/sito");
}
