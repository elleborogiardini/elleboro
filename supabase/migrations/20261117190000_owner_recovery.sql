create table public.owner_recovery (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  email text not null
);

create unique index owner_recovery_email_lower on public.owner_recovery (lower(email));

alter table public.owner_recovery enable row level security;

create policy owner_recovery_own on public.owner_recovery
  for all to authenticated
  using (profile_id = auth.uid() and public.is_owner())
  with check (profile_id = auth.uid() and public.is_owner());

grant select, insert, update, delete on public.owner_recovery to authenticated;
revoke all on public.owner_recovery from anon;
