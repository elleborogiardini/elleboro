import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { buildIcs } from "@/domain/calendar";
import { buildVcard } from "@/domain/card";
import { appointmentFeedSelect } from "@/domain/feed";
import { toPublicTestimonial } from "@/domain/testimonials";

const ownerId = "11111111-1111-1111-1111-111111111111";
const technicianId = "22222222-2222-2222-2222-222222222222";

const stub = `
create schema if not exists auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb
);
create table auth.session (uid uuid);
insert into auth.session (uid) values (null);
create function auth.uid() returns uuid language sql stable as $$
  select uid from auth.session
$$;
create schema if not exists storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null
);
create table storage.objects (
  id uuid primary key,
  bucket_id text,
  name text
);
alter table storage.objects enable row level security;
create role anon nologin;
create role authenticated nologin;
grant usage on schema auth to anon, authenticated;
grant select on auth.session to anon, authenticated;
`;

async function boot() {
  const db = new PGlite();
  await db.exec(stub);
  const migration = readFileSync("supabase/migrations/20261030160000_init.sql", "utf8").replace(
    "create extension if not exists pgcrypto;\n",
    "",
  );
  await db.exec(migration);
  await db.exec(`
    insert into public.allowed_emails (email, role) values
      ('owner@example.com', 'owner'),
      ('tech@example.com', 'technician');
    insert into auth.users (id, email) values
      ('${ownerId}', 'owner@example.com'),
      ('${technicianId}', 'tech@example.com');
  `);
  return db;
}

async function asRole<T extends Record<string, unknown>>(
  db: PGlite,
  role: "anon" | "authenticated",
  uid: string | null,
  sql: string,
) {
  await db.exec(`update auth.session set uid = ${uid ? `'${uid}'` : "null"}`);
  await db.exec(`set role ${role}`);
  try {
    return await db.query<T>(sql);
  } finally {
    await db.exec("reset role");
  }
}

describe("verifica del piano", () => {
  it("il proprietario compila il fascicolo e il tecnico non legge ciò che è riservato", async () => {
    const db = await boot();
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.clients (full_name, address, locality) values ('Marta Leone', 'Via delle Rose 4', 'Bologna')`,
    );
    const client = await asRole<{ id: string }>(
      db,
      "authenticated",
      ownerId,
      `select id from public.clients where full_name = 'Marta Leone'`,
    );
    const clientId = client.rows[0].id;
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.places (client_id, kind, label) values ('${clientId}', 'giardino', 'Giardino sud')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.preferences (client_id, category, label) values ('${clientId}', 'evitare', 'rose gialle')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.client_private (client_id, specifics) values ('${clientId}', 'Il cancello è sul retro.')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.note_sections (client_id, title, body) values ('${clientId}', 'Accesso', 'Prima stesura')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `update public.note_sections set body = 'Il cancello è sul retro.' where client_id = '${clientId}'`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.interventions (client_id, title, happened_on) values ('${clientId}', 'Potatura', '2026-05-12')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.appointments (client_id, title, starts_at, ends_at) values ('${clientId}', 'Potatura', '2026-05-12T09:00:00Z', '2026-05-12T11:00:00Z')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.photos (client_id, storage_path) values ('${clientId}', '${clientId}/foto.jpg')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.portfolio_items (public_path, alt, caption) values ('lavoro.jpg', 'Siepe di bosso', 'Primavera')`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `update public.site_content set contact_phone = '3330001111', owner_name = 'Hasith Conthrath' where id = 1`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.testimonials (quote, author, context, visible) values ('Preciso.', 'Anna', 'Giardino', true), ('Nascosta.', 'Luca', 'Balcone', false)`,
    );
    await asRole(
      db,
      "authenticated",
      ownerId,
      `insert into public.inquiries (name, contact, place_kind, need, message) values ('Luca Ferri', '3331112223', 'balcone', 'cura', 'Vorrei una visita.')`,
    );

    const names = await asRole<{ full_name: string }>(
      db,
      "authenticated",
      technicianId,
      `select full_name from public.clients`,
    );
    expect(names.rows).toEqual([{ full_name: "Marta Leone" }]);
    const places = await asRole<{ label: string }>(
      db,
      "authenticated",
      technicianId,
      `select label from public.places`,
    );
    expect(places.rows).toEqual([{ label: "Giardino sud" }]);
    expect(
      (await asRole(db, "authenticated", technicianId, `select label from public.preferences`)).rows,
    ).toEqual([]);
    expect(
      (await asRole(db, "authenticated", technicianId, `select specifics from public.client_private`))
        .rows,
    ).toEqual([]);
    expect(
      (await asRole(db, "authenticated", technicianId, `select body from public.note_sections`)).rows,
    ).toEqual([]);
    expect(
      (await asRole(db, "authenticated", technicianId, `select title from public.appointments`)).rows,
    ).toEqual([]);

    const clientsAfterInquiry = await asRole<{ n: number }>(
      db,
      "authenticated",
      ownerId,
      `select count(*)::int as n from public.clients`,
    );
    expect(clientsAfterInquiry.rows[0].n).toBe(1);

    await expect(
      asRole(db, "anon", null, `select full_name from public.clients`),
    ).rejects.toThrow(/permission denied/i);

    const site = await asRole<{ owner_name: string; contact_phone: string | null }>(
      db,
      "anon",
      null,
      `select * from public.public_site`,
    );
    expect(site.rows[0].owner_name).toBe("Hasith Conthrath");
    expect(site.rows[0].contact_phone).toBe("3330001111");
    expect(site.fields.map((field) => field.name)).not.toContain("address");
    expect(buildVcard({
      name: site.rows[0].owner_name,
      phone: site.rows[0].contact_phone,
      email: null,
      area: null,
    })).toContain("TEL:3330001111");

    const quotes = await asRole<{ quote: string }>(
      db,
      "anon",
      null,
      `select * from public.public_testimonials`,
    );
    expect(quotes.rows.map((row) => row.quote)).toEqual(["Preciso."]);
    expect(quotes.fields.map((field) => field.name)).not.toContain("client_id");
    expect(toPublicTestimonial({ quote: "Nascosta.", author: "Luca", context: "Balcone", visible: false })).toBeNull();

    const works = await asRole(db, "anon", null, `select * from public.public_portfolio`);
    expect(works.fields.map((field) => field.name)).not.toContain("client_id");

    const feed = await db.query<{
      id: string;
      title: string;
      starts_at: string;
      ends_at: string;
      include_address: boolean;
      full_name: string;
      address: string | null;
      label: string | null;
    }>(`
      select a.id, a.title, a.starts_at, a.ends_at, a.include_address,
             c.full_name, c.address, p.label
      from public.appointments a
      join public.clients c on c.id = a.client_id
      left join public.places p on p.client_id = a.client_id
    `);
    expect(appointmentFeedSelect).not.toMatch(/note|preference|specific|body/i);
    const ics = buildIcs(
      feed.rows.map((row) => ({
        id: row.id,
        title: row.title,
        startsAt: new Date(row.starts_at).toISOString(),
        endsAt: new Date(row.ends_at).toISOString(),
        clientName: row.full_name,
        placeLabel: row.label ?? "",
        address: row.address,
        includeAddress: row.include_address,
        notes: "Il cancello è sul retro.",
        preferences: "rose gialle",
      })),
    );
    expect(ics).toContain("Potatura");
    expect(ics).toContain("Marta Leone");
    expect(ics).not.toContain("cancello");
    expect(ics).not.toContain("rose gialle");
    expect(ics).not.toContain("Via delle Rose");

    await db.exec(`update public.site_content set contact_phone = null where id = 1`);
    const silent = await asRole<{ contact_phone: string | null }>(
      db,
      "anon",
      null,
      `select contact_phone from public.public_site`,
    );
    expect(
      buildVcard({
        name: "Hasith Conthrath",
        phone: silent.rows[0].contact_phone,
        email: null,
        area: null,
      }),
    ).not.toContain("TEL:");
    await db.close();
  });
});
