import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

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

const ownerId = "11111111-1111-1111-1111-111111111111";
const technicianId = "22222222-2222-2222-2222-222222222222";

async function database() {
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
    insert into public.clients (full_name, address) values ('Marta Leone', 'Via delle Rose 4');
    insert into public.client_private (client_id, specifics)
      select id, 'Non ama le rose gialle' from public.clients limit 1;
    insert into public.preferences (client_id, category, label)
      select id, 'evitare', 'rose gialle' from public.clients limit 1;
    insert into public.note_sections (client_id, title, body)
      select id, 'Accesso', 'Il cancello è sul retro.' from public.clients limit 1;
    insert into public.appointments (client_id, title, starts_at, ends_at)
      select id, 'Potatura', '2026-05-12T09:00:00Z', '2026-05-12T11:00:00Z' from public.clients limit 1;
    insert into public.places (client_id, kind, label)
      select id, 'giardino', 'Giardino sud' from public.clients limit 1;
    insert into public.interventions (client_id, title, happened_on)
      select id, 'Potatura', '2026-05-12' from public.clients limit 1;
  `);
  return db;
}

async function asRole<T>(db: PGlite, role: "anon" | "authenticated", uid: string | null, sql: string) {
  await db.exec(`update auth.session set uid = ${uid ? `'${uid}'` : "null"}`);
  await db.exec(`set role ${role}`);
  try {
    return await db.query<T>(sql);
  } finally {
    await db.exec("reset role");
  }
}

describe("sicurezza nel database", () => {
  it("l'anonimo non legge i clienti e legge solo il sito pubblicato, senza indirizzi", async () => {
    const db = await database();
    await expect(asRole(db, "anon", null, "select * from public.clients")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asRole(db, "anon", null, "select * from public.note_sections")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asRole(db, "anon", null, "select * from public.preferences")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asRole(db, "anon", null, "select * from public.appointments")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asRole(db, "anon", null, "select * from public.places")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asRole(db, "anon", null, "select * from public.interventions")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(asRole(db, "anon", null, "select * from public.profiles")).rejects.toThrow(
      /permission denied/i,
    );
    const site = await asRole<{ owner_name: string; contact_phone: string | null }>(
      db,
      "anon",
      null,
      "select * from public.public_site",
    );
    expect(site.rows).toEqual([
      expect.objectContaining({ owner_name: "Hasith Conthrath", contact_phone: null }),
    ]);
    expect(site.fields.map((field) => field.name)).not.toContain("address");
    await db.close();
  });

  it("il tecnico non legge preferenze, note e appuntamenti; il proprietario sì", async () => {
    const db = await database();
    const hidden = await asRole(
      db,
      "authenticated",
      technicianId,
      "select label from public.preferences",
    );
    expect(hidden.rows).toEqual([]);
    const specifics = await asRole(
      db,
      "authenticated",
      technicianId,
      "select specifics from public.client_private",
    );
    expect(specifics.rows).toEqual([]);
    const notes = await asRole(
      db,
      "authenticated",
      technicianId,
      "select title from public.note_sections",
    );
    expect(notes.rows).toEqual([]);
    const agenda = await asRole(
      db,
      "authenticated",
      technicianId,
      "select title from public.appointments",
    );
    expect(agenda.rows).toEqual([]);
    const clients = await asRole<{ full_name: string }>(
      db,
      "authenticated",
      technicianId,
      "select full_name from public.clients",
    );
    expect(clients.rows).toEqual([{ full_name: "Marta Leone" }]);
    const places = await asRole<{ label: string }>(
      db,
      "authenticated",
      technicianId,
      "select label from public.places",
    );
    expect(places.rows).toEqual([{ label: "Giardino sud" }]);
    const jobs = await asRole<{ title: string }>(
      db,
      "authenticated",
      technicianId,
      "select title from public.interventions",
    );
    expect(jobs.rows).toEqual([{ title: "Potatura" }]);
    const owner = await asRole<{ label: string }>(
      db,
      "authenticated",
      ownerId,
      "select label from public.preferences",
    );
    expect(owner.rows).toEqual([{ label: "rose gialle" }]);
    await db.close();
  });
});
