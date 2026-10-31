import { upcomingAppointments } from "@/domain/calendar";
import { signedPhotoSeconds } from "@/domain/photo";
import { agendaListSelect } from "@/domain/feed";
import { rowOrFail, rowsOrFail } from "@/domain/read";
import { createClient } from "@/lib/supabase/server";

export type Place = {
  id: string;
  kind: string;
  label: string;
  notes: string | null;
};

export type Intervention = {
  id: string;
  happened_on: string;
  title: string;
  notes: string | null;
  place_id: string | null;
};

export type Preference = {
  id: string;
  category: string;
  label: string;
  note: string | null;
};

export type NoteSection = {
  id: string;
  title: string;
  body: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  include_address: boolean;
  client_id: string;
  place_id: string | null;
  intervention_id: string | null;
  clients: { full_name: string } | null;
  places: { label: string } | null;
};

export type Inquiry = {
  id: string;
  name: string;
  contact: string;
  place_kind: string;
  need: string;
  area: string | null;
  message: string;
  status: string;
  created_at: string;
};

export async function listPlaceOptions(): Promise<
  { id: string; label: string; client_id: string }[]
> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("places").select("id, label, client_id").order("label");
  return rowsOrFail(error, data);
}

export async function listPlaces(clientId: string): Promise<Place[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("places")
    .select("id, kind, label, notes")
    .eq("client_id", clientId)
    .order("label");
  return rowsOrFail(error, data);
}

export async function listInterventions(clientId: string): Promise<Intervention[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("interventions")
    .select("id, happened_on, title, notes, place_id")
    .eq("client_id", clientId)
    .is("archived_at", null)
    .order("happened_on", { ascending: false });
  return rowsOrFail(error, data);
}

export async function listPreferences(clientId: string): Promise<Preference[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("preferences")
    .select("id, category, label, note")
    .eq("client_id", clientId)
    .order("category");
  return rowsOrFail(error, data);
}

export async function getSpecifics(clientId: string): Promise<string> {
  const supabase = await createClient();
  if (!supabase) return "";
  const { data, error } = await supabase
    .from("client_private")
    .select("specifics")
    .eq("client_id", clientId)
    .maybeSingle();
  return rowOrFail(error, data)?.specifics ?? "";
}

export async function listNotes(clientId: string): Promise<NoteSection[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("note_sections")
    .select("id, title, body, updated_at")
    .eq("client_id", clientId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  return rowsOrFail(error, data);
}

export async function listAppointments(): Promise<Appointment[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("appointments")
    .select(
      agendaListSelect,
    )
    .neq("status", "annullato")
    .order("starts_at");
  return upcomingAppointments(rowsOrFail(error, data) as unknown as Appointment[], new Date());
}

export async function listInquiries(): Promise<Inquiry[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, name, contact, place_kind, need, area, message, status, created_at")
    .order("created_at", { ascending: false });
  return rowsOrFail(error, data);
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, name, contact, place_kind, need, area, message, status, created_at")
    .eq("id", id)
    .maybeSingle();
  return rowOrFail(error, data);
}

export async function listPhotos(clientId: string) {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("photos")
    .select("id, storage_path, place_id, intervention_id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  const photos = rowsOrFail(error, data);
  const signed = await Promise.all(
    photos.map(async (photo) => {
      const { data: url } = await supabase.storage
        .from("private")
        .createSignedUrl(photo.storage_path, signedPhotoSeconds());
      return {
        id: photo.id,
        placeId: photo.place_id,
        interventionId: photo.intervention_id,
        url: url?.signedUrl ?? "",
      };
    }),
  );
  return signed;
}

export async function listEditorTestimonials() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, quote, author, context, visible, sort_order")
    .order("sort_order");
  return rowsOrFail(error, data);
}

export async function listPortfolioEditor() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("id, public_path, caption, alt, published, sort_order")
    .order("sort_order");
  return rowsOrFail(error, data);
}
