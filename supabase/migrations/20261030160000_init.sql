-- Elleboro Giardini. No emails, keys, or project refs in this file.

create extension if not exists pgcrypto;

create table public.allowed_emails (
  email text primary key,
  role text not null check (role in ('owner', 'technician'))
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'technician')),
  display_name text not null default ''
);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() in ('owner', 'technician')
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'owner'
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.current_app_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  locality text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null check (kind in ('giardino', 'balcone', 'terrazzo', 'interno', 'altro')),
  label text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  category text not null check (category in ('fiore', 'colore', 'pianta', 'evitare', 'altro')),
  label text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.client_private (
  client_id uuid primary key references public.clients (id) on delete cascade,
  specifics text not null default '',
  updated_at timestamptz not null default now()
);

create table public.note_sections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null default 'Nota',
  body text not null default '',
  archived_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  happened_on date not null,
  title text not null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  intervention_id uuid references public.interventions (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text not null,
  status text not null default 'previsto' check (status in ('previsto', 'fatto', 'annullato')),
  include_address boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  intervention_id uuid references public.interventions (id) on delete set null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  public_path text not null,
  caption text,
  alt text not null,
  sort_order int not null default 0,
  published boolean not null default true
);

create table public.site_content (
  id int primary key default 1 check (id = 1),
  hero_title text not null default 'Elleboro Giardini',
  hero_lead text not null default 'Cura di giardini, balconi e terrazzi.',
  owner_name text not null default 'Hasith Conthrath',
  bio text not null default 'Bozza: riscrivi con le tue parole.',
  services jsonb not null default '[]'::jsonb,
  contact_phone text,
  contact_email text,
  service_area text,
  portrait_path text,
  portrait_alt text not null default 'Hasith Conthrath, Elleboro Giardini',
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author text not null,
  context text not null,
  sort_order int not null default 0,
  visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  place_kind text not null check (place_kind in ('giardino', 'balcone', 'terrazzo', 'altro')),
  need text not null check (need in ('progetto', 'cura', 'entrambi')),
  area text,
  message text not null,
  status text not null default 'nuova' check (status in ('nuova', 'in corso', 'chiusa')),
  created_at timestamptz not null default now()
);

create table public.inquiry_throttle (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

insert into public.site_content (id) values (1);

alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.places enable row level security;
alter table public.preferences enable row level security;
alter table public.client_private enable row level security;
alter table public.note_sections enable row level security;
alter table public.interventions enable row level security;
alter table public.appointments enable row level security;
alter table public.photos enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.site_content enable row level security;
alter table public.testimonials enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_throttle enable row level security;

create policy staff_clients on public.clients
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy staff_places on public.places
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy staff_photos on public.photos
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy staff_interventions on public.interventions
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy staff_inquiries on public.inquiries
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy staff_site on public.site_content
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy anon_published_site on public.site_content
  for select to anon
  using (published = true);

create policy staff_portfolio on public.portfolio_items
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy anon_published_portfolio on public.portfolio_items
  for select to anon
  using (published = true);

create policy staff_testimonials on public.testimonials
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy anon_visible_testimonials on public.testimonials
  for select to anon
  using (visible = true);

create policy owner_preferences on public.preferences
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy owner_private on public.client_private
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy owner_notes on public.note_sections
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy owner_appointments on public.appointments
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create policy staff_profiles on public.profiles
  for select to authenticated
  using (public.is_staff());

create view public.public_site with (security_invoker = true) as
  select owner_name, hero_title, hero_lead, bio, services, contact_phone,
         contact_email, service_area, portrait_path, portrait_alt
  from public.site_content
  where published = true;

create view public.public_portfolio with (security_invoker = true) as
  select id, public_path, caption, alt, sort_order
  from public.portfolio_items
  where published = true;

create view public.public_testimonials with (security_invoker = true) as
  select id, quote, author, context, sort_order
  from public.testimonials
  where visible = true;

grant select on public.public_site to anon, authenticated;
grant select on public.public_portfolio to anon, authenticated;
grant select on public.public_testimonials to anon, authenticated;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.places to authenticated;
grant select, insert, update, delete on public.photos to authenticated;
grant select, insert, update, delete on public.interventions to authenticated;
grant select, insert, update, delete on public.inquiries to authenticated;
grant select, insert, update, delete on public.site_content to authenticated;
grant select on public.site_content to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant select on public.portfolio_items to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.preferences to authenticated;
grant select, insert, update, delete on public.client_private to authenticated;
grant select, insert, update, delete on public.note_sections to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select on public.profiles to authenticated;

revoke all on public.clients from anon;
revoke all on public.places from anon;
revoke all on public.interventions from anon;
revoke all on public.profiles from anon;
revoke all on public.preferences from anon;
revoke all on public.client_private from anon;
revoke all on public.note_sections from anon;
revoke all on public.appointments from anon;
revoke all on public.inquiries from anon;
revoke all on public.photos from anon;
revoke all on public.inquiry_throttle from anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned text;
begin
  select role into assigned from public.allowed_emails where lower(email) = lower(new.email);
  if assigned is null then
    raise exception 'email not allowed';
  end if;
  insert into public.profiles (id, role, display_name)
  values (new.id, assigned, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('private', 'private', false), ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy staff_read_private on storage.objects
  for select to authenticated
  using (bucket_id = 'private' and public.is_staff());

create policy staff_write_private on storage.objects
  for insert to authenticated
  with check (bucket_id = 'private' and public.is_staff());

create policy staff_update_private on storage.objects
  for update to authenticated
  using (bucket_id = 'private' and public.is_staff());

create policy staff_delete_private on storage.objects
  for delete to authenticated
  using (bucket_id = 'private' and public.is_staff());

create policy public_read_portfolio on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio');

create policy staff_write_portfolio on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio' and public.is_staff());
