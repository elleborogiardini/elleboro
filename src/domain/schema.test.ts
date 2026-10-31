import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readdirSync("supabase/migrations")
  .filter((name) => name.endsWith(".sql"))
  .map((name) => readFileSync(`supabase/migrations/${name}`, "utf8"))
  .join("\n");

describe("schema e permessi", () => {
  it("accende RLS e non concede i clienti all'anonimo", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("revoke all on public.clients from anon");
    expect(sql).toContain("revoke all on public.preferences from anon");
    expect(sql).toContain("revoke all on public.note_sections from anon");
    expect(sql).toContain("revoke all on public.appointments from anon");
    expect(sql).toContain("revoke all on public.places from anon");
    expect(sql).toContain("revoke all on public.interventions from anon");
    expect(sql).toContain("revoke all on public.profiles from anon");
    expect(sql).not.toMatch(/grant select on public\.clients to anon/i);
  });

  it("riserva preferenze, note e appuntamenti al proprietario", () => {
    expect(sql).toContain("owner_preferences");
    expect(sql).toContain("public.is_owner()");
    expect(sql).toContain("owner_notes");
    expect(sql).toContain("owner_appointments");
    expect(sql).not.toContain("is_staff() and");
  });

  it("il feed e il modulo pubblico usano il ruolo di servizio", () => {
    expect(sql).toContain("grant select on public.appointments to service_role");
    expect(sql).toContain("grant select on public.clients to service_role");
    expect(sql).toContain("grant select on public.places to service_role");
    expect(sql).toContain("grant insert on public.inquiries to service_role");
    expect(sql).toContain("grant insert on public.inquiry_throttle to service_role");
  });

  it("le viste pubbliche non selezionano un id cliente", () => {
    const portfolio = sql.split("public.public_portfolio")[1]?.split(";")[0] ?? "";
    const quotes = sql.split("public.public_testimonials")[1]?.split(";")[0] ?? "";
    expect(portfolio).not.toContain("client_id");
    expect(quotes).not.toContain("client_id");
  });
});
