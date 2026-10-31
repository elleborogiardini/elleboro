import { clientsMatching } from "@/domain/dossier";
import { rowOrFail, rowsOrFail } from "@/domain/read";
import { draftSite, type PublicSite, type Service } from "@/domain/draft";
import { siteForEditor, siteForVisitor, type EditorSite } from "@/domain/public-page";
import { toPublicTestimonial, type PublicTestimonial } from "@/domain/testimonials";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "technician";

export type ClientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  locality: string | null;
};

function asServices(value: unknown): Service[] {
  if (!Array.isArray(value)) return draftSite.services;
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { title?: string; body?: string };
    if (!row.title) return [];
    return [{ title: row.title, body: row.body ?? "" }];
  });
}

export async function getRole(): Promise<Role | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .maybeSingle();
  if (data?.role === "owner" || data?.role === "technician") return data.role;
  return null;
}

export async function getPublicSite(): Promise<PublicSite | null> {
  const supabase = await createClient();
  if (!supabase) return siteForVisitor(null, false, draftSite);
  const { data, error } = await supabase
    .from("public_site")
    .select(
      "owner_name, hero_title, hero_lead, bio, services, contact_phone, contact_email, service_area, portrait_path, portrait_alt",
    )
    .maybeSingle();
  if (error) return siteForVisitor(null, false, draftSite);
  if (!data) return siteForVisitor(null, true, draftSite);
  return siteForVisitor(
    {
      ownerName: data.owner_name,
      heroTitle: data.hero_title,
      heroLead: data.hero_lead,
      bio: data.bio,
      services: asServices(data.services),
      phone: data.contact_phone,
      email: data.contact_email,
      area: data.service_area,
      portraitPath: data.portrait_path,
      portraitAlt: data.portrait_alt,
    },
    true,
    draftSite,
  );
}

export async function getEditorSite(): Promise<EditorSite> {
  const supabase = await createClient();
  if (!supabase) return siteForEditor(null, draftSite);
  const { data, error } = await supabase
    .from("site_content")
    .select(
      "owner_name, hero_title, hero_lead, bio, services, contact_phone, contact_email, service_area, portrait_path, portrait_alt, published",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return siteForEditor(null, draftSite);
  return siteForEditor(
    {
      ownerName: data.owner_name,
      heroTitle: data.hero_title,
      heroLead: data.hero_lead,
      bio: data.bio,
      services: asServices(data.services),
      phone: data.contact_phone,
      email: data.contact_email,
      area: data.service_area,
      portraitPath: data.portrait_path,
      portraitAlt: data.portrait_alt,
      published: data.published,
    },
    draftSite,
  );
}

export async function getPublicWorks(): Promise<
  { id: string; path: string; caption: string | null; alt: string }[]
> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_portfolio")
    .select("id, public_path, caption, alt, sort_order")
    .order("sort_order");
  return (data ?? []).map((row) => ({
    id: row.id,
    path: row.public_path,
    caption: row.caption,
    alt: row.alt,
  }));
}

export async function getPublicQuotes(): Promise<PublicTestimonial[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_testimonials")
    .select("quote, author, context, sort_order")
    .order("sort_order");
  return (data ?? []).flatMap((row) => {
    const published = toPublicTestimonial({ ...row, visible: true });
    return published ? [published] : [];
  });
}

export async function listClients(query: string): Promise<ClientRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, address, locality, archived_at")
    .order("full_name");
  return clientsMatching(
    rowsOrFail(error, data).map((row) => ({ ...row, archivedAt: row.archived_at })),
    query,
  ).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    locality: row.locality,
  }));
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, address, locality")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();
  return rowOrFail(error, data);
}
