export type Role = "anon" | "technician" | "owner";

export type Resource =
  | "clients"
  | "places"
  | "photos"
  | "interventions"
  | "inquiries"
  | "site_content"
  | "testimonials"
  | "preferences"
  | "client_private"
  | "note_sections"
  | "appointments"
  | "public_site"
  | "public_portfolio"
  | "testimonials_public";

const ownerOnly = new Set<Resource>([
  "preferences",
  "client_private",
  "note_sections",
  "appointments",
]);

const staff = new Set<Resource>([
  "clients",
  "places",
  "photos",
  "interventions",
  "inquiries",
  "site_content",
  "testimonials",
  ...ownerOnly,
]);

const anon = new Set<Resource>([
  "public_site",
  "public_portfolio",
  "testimonials_public",
]);

export function canRead(role: Role, resource: Resource): boolean {
  if (role === "anon") return anon.has(resource);
  if (role === "technician") return staff.has(resource) && !ownerOnly.has(resource);
  return staff.has(resource) || anon.has(resource);
}
