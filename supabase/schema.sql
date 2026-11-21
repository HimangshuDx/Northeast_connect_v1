-- Northeast Connect (PS05) — Hardened Supabase Postgres Schema (Idempotent)
-- Safe to re-run in the Supabase SQL Editor. Run this FIRST, then run supabase/seed.sql.
--
-- Security Model Overview (see supabase/SECURITY.md for full details):
-- 1. Base table `public.reports` contains sensitive caller phone numbers, reporter names,
--    and internal coordinator notes. SELECT, UPDATE, and DELETE on `public.reports` are
--    restricted strictly to authenticated users with role COORDINATOR or ADMIN.
-- 2. Public Situation Board & NGO Operations read from `public.reports_public`, a view
--    intentionally created WITHOUT `security_invoker = on` so it runs with view-owner
--    privileges and exposes only non-sensitive columns with masked `contact_phone` and
--    no `reporter_name` or `internal_notes`.
--    NOTE: Supabase Database Linter will flag `reports_public` with a "security definer view"
--    advisory; this is an intentional, accepted trade-off so `anon` never receives SELECT
--    access on base `public.reports`.
-- 3. Anonymous users can still submit public reports (`INSERT` on `public.reports` or via
--    `submit_public_report` RPC for idempotent `client_uuid` deduplication) and "+1 Confirm"
--    votes (`confirmations`), subject to strict CHECK constraints and workflow defaults.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Organization Profiles & Role-Based Access Control (Supabase Auth)
-- ============================================================================
-- Authoritative role source for authenticated response partners & coordinators.
-- Also supports JWT `app_metadata.role` (set via Supabase Admin API or SQL).
-- Roles:
--   NGO_MEMBER   -> Relief Operations Dashboard (/ngo)
--   VOLUNTEER    -> Relief Operations Dashboard (/ngo)
--   COORDINATOR  -> Coordinator Desk (/coordinator) + Relief Operations (/ngo)
--   ADMIN        -> Full administrative access
create table if not exists public.organization_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  organization_name text not null check (char_length(trim(organization_name)) between 2 and 140),
  role text not null check (role in ('NGO_MEMBER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN')),
  district_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_profiles enable row level security;

-- Helper returning the authenticated user's verified role.
-- Checks active `public.organization_profiles` row first, then falls back to
-- trusted `auth.jwt() -> 'app_metadata' ->> 'role'` (never `user_metadata`).
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select op.role
      from public.organization_profiles op
      where op.user_id = auth.uid()
        and op.is_active = true
      limit 1
    ),
    case
      when upper(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', ''))
        in ('NGO_MEMBER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN')
      then upper(auth.jwt() -> 'app_metadata' ->> 'role')
      else null
    end,
    'CITIZEN'
  );
$$;

create or replace function public.is_response_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and public.current_user_role() in ('NGO_MEMBER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN');
$$;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and public.current_user_role() in ('COORDINATOR', 'ADMIN');
$$;

create or replace function public.is_coordinator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_coordinator();
$$;

drop policy if exists "Users read own organization profile" on public.organization_profiles;
create policy "Users read own organization profile"
  on public.organization_profiles
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_coordinator());

drop policy if exists "Coordinators manage organization profiles" on public.organization_profiles;
create policy "Coordinators manage organization profiles"
  on public.organization_profiles
  for all
  to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- ============================================================================
-- 2. Disaster Advisories
-- ============================================================================
create table if not exists public.advisories (
  id text primary key,
  title text not null,
  district_id text not null,
  district_name text not null,
  severity text not null check (severity in ('CRITICAL', 'WARNING', 'WATCH')),
  instructions text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null,
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('VERIFIED', 'UNVERIFIED')),
  is_demo_data boolean not null default false,
  is_stale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 3. Lifeline Corridors
-- ============================================================================
create table if not exists public.corridors (
  id text primary key,
  name text not null,
  corridor_type text not null check (corridor_type in ('Highway', 'Road', 'Bridge', 'Ferry')),
  district_id text not null,
  district_name text not null,
  status text not null check (status in ('PASSABLE', 'SINGLE_LANE', 'LANDSLIDE_BLOCKED', 'SUBMERGED', 'CLOSED', 'UNKNOWN')),
  advisory_note text not null,
  last_confirmed_at timestamptz not null default now(),
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('VERIFIED', 'UNVERIFIED')),
  is_demo_data boolean not null default false,
  is_stale boolean not null default false,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. Community Reports & Urgent Help Requests
-- ============================================================================
-- Note: syncStatus stays strictly client-side in device Outbox (not stored in DB).
create table if not exists public.reports (
  id text primary key,
  client_uuid text unique not null,
  mode text not null check (mode in ('HAZARD', 'HELP_REQUEST')),
  district_id text not null check (char_length(trim(district_id)) between 2 and 64 and district_id <> 'all'),
  district_name text not null check (char_length(trim(district_name)) between 2 and 100),
  corridor_or_block text not null check (char_length(trim(corridor_or_block)) between 2 and 160),
  locality text not null check (char_length(trim(locality)) between 2 and 200),
  coordinates_lat double precision check (coordinates_lat is null or (coordinates_lat >= -90 and coordinates_lat <= 90)),
  coordinates_lng double precision check (coordinates_lng is null or (coordinates_lng >= -180 and coordinates_lng <= 180)),
  category text not null check (category in ('Flooding', 'Landslide', 'Road Blockage', 'Bridge Damage', 'Stranded Persons', 'Medical Emergency', 'Power / Telecom Outage')),
  severity text not null check (severity in ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  description text not null check (char_length(trim(description)) between 12 and 2000),
  affected_people_count integer not null default 1 check (affected_people_count between 1 and 500),
  vulnerability_tags text[] not null default '{}',
  assistance_needs text[] not null default '{}',
  contact_phone text not null check (
    char_length(trim(contact_phone)) between 10 and 25
    and char_length(regexp_replace(contact_phone, '[^0-9]', '', 'g')) between 10 and 15
    and trim(contact_phone) ~ '^[+0-9() -]{10,25}$'
  ),
  reporter_name text not null check (char_length(trim(reporter_name)) between 2 and 100),
  reporting_for_others boolean not null default false,
  created_at timestamptz not null default now(),
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('VERIFIED', 'UNVERIFIED', 'UNDER_REVIEW', 'REJECTED')),
  assistance_status text not null default 'SUBMITTED' check (assistance_status in ('SUBMITTED', 'ACCEPTED', 'DISPATCHED', 'RESOLVED')),
  confirmations integer not null default 1 check (confirmations >= 0 and confirmations <= 100000),
  assigned_unit text,
  internal_notes jsonb not null default '[]'::jsonb,
  merged_into_id text,
  merged_report_ids text[] not null default '{}',
  is_demo_data boolean not null default false,
  is_stale boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Idempotent CHECK constraint hardening when upgrading an existing database
do $$
begin
  -- Replace older 1..100000 affected_people_count constraint with 1..500
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.reports'::regclass
      and conname = 'reports_affected_people_count_check'
  ) then
    alter table public.reports drop constraint reports_affected_people_count_check;
  end if;
  alter table public.reports
    add constraint reports_affected_people_count_check
    check (affected_people_count between 1 and 500);

  -- Replace contact_phone constraint with strict phone format + 10..15 digits check
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.reports'::regclass
      and conname = 'reports_contact_phone_check'
  ) then
    alter table public.reports drop constraint reports_contact_phone_check;
  end if;
  alter table public.reports
    add constraint reports_contact_phone_check
    check (
      char_length(trim(contact_phone)) between 10 and 25
      and char_length(regexp_replace(contact_phone, '[^0-9]', '', 'g')) between 10 and 15
      and trim(contact_phone) ~ '^[+0-9() -]{10,25}$'
    );

  -- Allowed enum arrays & text caps
  alter table public.reports drop constraint if exists reports_vulnerability_tags_check;
  alter table public.reports
    add constraint reports_vulnerability_tags_check
    check (
      coalesce(array_length(vulnerability_tags, 1), 0) <= 5
      and vulnerability_tags <@ array['Elderly', 'Infants', 'Pregnant', 'Medical Need', 'Disabled']::text[]
    );

  alter table public.reports drop constraint if exists reports_assistance_needs_check;
  alter table public.reports
    add constraint reports_assistance_needs_check
    check (
      coalesce(array_length(assistance_needs, 1), 0) <= 4
      and assistance_needs <@ array['Rescue', 'Medical', 'Food / Water', 'Shelter']::text[]
    );

  alter table public.reports drop constraint if exists reports_assigned_unit_check;
  alter table public.reports
    add constraint reports_assigned_unit_check
    check (assigned_unit is null or char_length(trim(assigned_unit)) <= 120);

  alter table public.reports drop constraint if exists reports_id_check;
  alter table public.reports
    add constraint reports_id_check
    check (char_length(trim(id)) between 3 and 128 and id ~ '^[a-zA-Z0-9_-]+$');

  alter table public.reports drop constraint if exists reports_client_uuid_check;
  alter table public.reports
    add constraint reports_client_uuid_check
    check (char_length(trim(client_uuid)) between 8 and 128);
end $$;

create index if not exists idx_reports_district_created on public.reports (district_id, created_at desc);

-- ============================================================================
-- 5. Community "+1 Confirm" Votes (one per device token per report)
-- ============================================================================
create table if not exists public.confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  device_token text not null check (char_length(trim(device_token)) between 8 and 128),
  created_at timestamptz not null default now(),
  unique (report_id, device_token)
);

-- Keep reports.confirmations counter atomic on insert/delete
create or replace function public.handle_confirmation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.reports
      set confirmations = confirmations + 1,
          updated_at = now()
      where id = new.report_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.reports
      set confirmations = greatest(0, confirmations - 1),
          updated_at = now()
      where id = old.report_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_confirmation_change on public.confirmations;
create trigger trg_confirmation_change
  after insert or delete on public.confirmations
  for each row execute function public.handle_confirmation_change();

-- ============================================================================
-- 6. Emergency Resources & Coordinator Audit Logs
-- ============================================================================
create table if not exists public.resources (
  id text primary key,
  name text not null,
  category text not null check (category in ('Relief Camps', 'Medical Posts', 'Water / Ration Points', 'Boat Rescue Points')),
  district_id text not null,
  district_name text not null,
  area text not null,
  landmark text not null,
  contact_phone text not null,
  capacity_status text not null check (capacity_status in ('OPEN_AVAILABLE', 'NEAR_CAPACITY', 'FULL', 'TEMPORARILY_CLOSED', 'UNKNOWN')),
  available_supplies text[] not null default '{}',
  last_confirmed_at timestamptz not null default now(),
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('VERIFIED', 'UNVERIFIED')),
  is_demo_data boolean not null default false,
  is_stale boolean not null default false,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  actor text not null check (char_length(trim(actor)) between 2 and 80),
  action_type text not null check (action_type in ('VERIFY_REPORT', 'ASSISTANCE_UPDATE', 'ASSIGN_UNIT', 'ADD_NOTE', 'MERGE_REPORT', 'DELETE_REPORT', 'UPDATE_CORRIDOR', 'UPDATE_RESOURCE')),
  target_label text not null check (char_length(trim(target_label)) between 1 and 200),
  summary text not null check (char_length(trim(summary)) between 1 and 500),
  is_demo_data boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. Masked Public Reports View (NO `security_invoker` — accepted trade-off)
-- ============================================================================
-- Exposes ONLY non-sensitive report fields for the public Situation Board and
-- NGO Operations feed. Masks `contact_phone` and omits `reporter_name` and
-- `internal_notes` entirely. Drop + recreate ensures column changes apply cleanly.
drop view if exists public.reports_public;
create view public.reports_public as
select
  id,
  client_uuid,
  mode,
  district_id,
  district_name,
  corridor_or_block,
  locality,
  coordinates_lat,
  coordinates_lng,
  category,
  severity,
  description,
  affected_people_count,
  vulnerability_tags,
  assistance_needs,
  case
    when length(contact_phone) > 5 then left(contact_phone, length(contact_phone) - 5) || 'XXXXX'
    else 'XXXXX'
  end as contact_phone,
  reporting_for_others,
  created_at,
  verification_status,
  assistance_status,
  confirmations,
  assigned_unit,
  merged_into_id,
  merged_report_ids,
  is_demo_data,
  is_stale,
  updated_at
from public.reports;

revoke all on public.reports_public from public;
grant select on public.reports_public to anon, authenticated;

-- ============================================================================
-- 8. NGO / Volunteer Task Assignments & Profiles
-- ============================================================================
create table if not exists public.ngo_assignments (
  id text primary key,
  report_id text not null references public.reports(id) on delete cascade,
  volunteer_name text not null check (char_length(trim(volunteer_name)) between 2 and 80),
  organization text not null check (char_length(trim(organization)) between 2 and 100),
  capability text not null check (capability in ('Boat Rescue', 'Medical Aid', 'Food & Water Distribution', 'Shelter & Evacuation', 'Road & Debris Support')),
  task_status text not null default 'PLEDGED' check (task_status in ('PLEDGED', 'EN_ROUTE', 'ON_SITE', 'RELIEF_DELIVERED')),
  note text not null default '' check (char_length(note) <= 500),
  accepted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_demo_data boolean not null default false,
  owner_user_id uuid references auth.users(id) on delete set null default auth.uid()
);

alter table public.ngo_assignments
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null default auth.uid();

create index if not exists idx_ngo_assignments_report on public.ngo_assignments (report_id);

create table if not exists public.volunteer_profiles (
  id text primary key,
  name text not null check (char_length(trim(name)) between 2 and 80),
  organization text not null check (char_length(trim(organization)) between 2 and 100),
  district_id text not null,
  capability text not null check (capability in ('Boat Rescue', 'Medical Aid', 'Food & Water Distribution', 'Shelter & Evacuation', 'Road & Debris Support')),
  availability text not null default 'AVAILABLE' check (availability in ('AVAILABLE', 'BUSY', 'OFFLINE')),
  team_size integer not null default 1 check (team_size between 1 and 500),
  resource_inventory text[] not null default '{}',
  updated_at timestamptz not null default now(),
  owner_user_id uuid references auth.users(id) on delete set null default auth.uid()
);

alter table public.volunteer_profiles
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null default auth.uid();

-- ============================================================================
-- 9. Table Grants & Strict Row Level Security Policies
-- ============================================================================
alter table public.advisories enable row level security;
alter table public.corridors enable row level security;
alter table public.reports enable row level security;
alter table public.confirmations enable row level security;
alter table public.resources enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ngo_assignments enable row level security;
alter table public.volunteer_profiles enable row level security;

-- Lock down base `reports` grants: `anon` can ONLY insert (never select/update/delete)
revoke all on public.reports from anon;
grant insert on public.reports to anon;
grant select, insert, update, delete on public.reports to authenticated;

-- Advisories: public read, coordinator write
drop policy if exists "Public read advisories" on public.advisories;
create policy "Public read advisories" on public.advisories
  for select to anon, authenticated using (true);

drop policy if exists "Coordinators write advisories" on public.advisories;
create policy "Coordinators write advisories" on public.advisories
  for all to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

-- Corridors: public read, coordinator write
drop policy if exists "Public read corridors" on public.corridors;
create policy "Public read corridors" on public.corridors
  for select to anon, authenticated using (true);

drop policy if exists "Demo update corridors" on public.corridors;
drop policy if exists "Coordinators update corridors" on public.corridors;
create policy "Coordinators update corridors" on public.corridors
  for update to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

drop policy if exists "Coordinators insert corridors" on public.corridors;
create policy "Coordinators insert corridors" on public.corridors
  for insert to authenticated
  with check (public.is_coordinator());

drop policy if exists "Coordinators delete corridors" on public.corridors;
create policy "Coordinators delete corridors" on public.corridors
  for delete to authenticated
  using (public.is_coordinator());

-- Resources: public read, coordinator write
drop policy if exists "Public read resources" on public.resources;
create policy "Public read resources" on public.resources
  for select to anon, authenticated using (true);

drop policy if exists "Demo update resources" on public.resources;
drop policy if exists "Coordinators update resources" on public.resources;
create policy "Coordinators update resources" on public.resources
  for update to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

drop policy if exists "Coordinators insert resources" on public.resources;
create policy "Coordinators insert resources" on public.resources
  for insert to authenticated
  with check (public.is_coordinator());

drop policy if exists "Coordinators delete resources" on public.resources;
create policy "Coordinators delete resources" on public.resources
  for delete to authenticated
  using (public.is_coordinator());

-- Reports:
--   * NO public/anon SELECT on base `public.reports` (must read `reports_public`).
--   * Authenticated SELECT/UPDATE/DELETE restricted to COORDINATOR / ADMIN.
--   * Anonymous & authenticated INSERT allowed with strict safe defaults enforced.
drop policy if exists "Public read reports" on public.reports;
drop policy if exists "Coordinators read full reports" on public.reports;
create policy "Coordinators read full reports" on public.reports
  for select to authenticated
  using (public.is_coordinator());

drop policy if exists "Public insert reports" on public.reports;
create policy "Public insert reports" on public.reports
  for insert to anon, authenticated
  with check (
    verification_status = 'UNVERIFIED'
    and assistance_status = 'SUBMITTED'
    and confirmations = 1
    and assigned_unit is null
    and internal_notes = '[]'::jsonb
    and merged_into_id is null
    and merged_report_ids = '{}'::text[]
    and is_demo_data = false
    and (
      mode <> 'HELP_REQUEST'
      or coalesce(array_length(assistance_needs, 1), 0) >= 1
    )
  );

drop policy if exists "Demo update reports" on public.reports;
drop policy if exists "Coordinators update reports" on public.reports;
create policy "Coordinators update reports" on public.reports
  for update to authenticated
  using (public.is_coordinator())
  with check (public.is_coordinator());

drop policy if exists "Demo delete reports" on public.reports;
drop policy if exists "Coordinators delete reports" on public.reports;
create policy "Coordinators delete reports" on public.reports
  for delete to authenticated
  using (public.is_coordinator());

-- Confirmations:
--   * No broad anon SELECT or unrestricted DELETE (use RPCs or exact x-device-token header).
drop policy if exists "Public read confirmations" on public.confirmations;
drop policy if exists "Read own confirmations" on public.confirmations;
create policy "Read own confirmations" on public.confirmations
  for select to anon, authenticated
  using (
    public.is_coordinator()
    or device_token = coalesce(
      nullif((current_setting('request.headers', true)::jsonb ->> 'x-device-token'), ''),
      '__none__'
    )
  );

drop policy if exists "Public insert confirmations" on public.confirmations;
create policy "Public insert confirmations" on public.confirmations
  for insert to anon, authenticated
  with check (
    char_length(trim(device_token)) between 8 and 128
    and exists (select 1 from public.reports r where r.id = report_id)
  );

drop policy if exists "Public delete own confirmations" on public.confirmations;
drop policy if exists "Delete own confirmations" on public.confirmations;
create policy "Delete own confirmations" on public.confirmations
  for delete to anon, authenticated
  using (
    public.is_coordinator()
    or device_token = coalesce(
      nullif((current_setting('request.headers', true)::jsonb ->> 'x-device-token'), ''),
      '__none__'
    )
  );

-- Audit Logs: Coordinator / Admin only
drop policy if exists "Public read audit_logs" on public.audit_logs;
drop policy if exists "Coordinators read audit_logs" on public.audit_logs;
create policy "Coordinators read audit_logs" on public.audit_logs
  for select to authenticated
  using (public.is_coordinator());

drop policy if exists "Demo insert audit_logs" on public.audit_logs;
drop policy if exists "Coordinators insert audit_logs" on public.audit_logs;
create policy "Coordinators insert audit_logs" on public.audit_logs
  for insert to authenticated
  with check (public.is_coordinator());

-- NGO Assignments:
--   * Authenticated response partners can view assignments.
--   * NGO/Volunteer can insert/update/delete only their own rows (`owner_user_id = auth.uid()`);
--     Coordinators/Admins can manage any assignment.
drop policy if exists "Public read ngo_assignments" on public.ngo_assignments;
drop policy if exists "Partners read ngo_assignments" on public.ngo_assignments;
create policy "Partners read ngo_assignments" on public.ngo_assignments
  for select to authenticated
  using (public.is_response_partner());

drop policy if exists "Demo write ngo_assignments" on public.ngo_assignments;
drop policy if exists "Partners insert ngo_assignments" on public.ngo_assignments;
create policy "Partners insert ngo_assignments" on public.ngo_assignments
  for insert to authenticated
  with check (
    public.is_response_partner()
    and (owner_user_id = auth.uid() or public.is_coordinator())
    and is_demo_data = false
  );

drop policy if exists "Demo update ngo_assignments" on public.ngo_assignments;
drop policy if exists "Partners update ngo_assignments" on public.ngo_assignments;
create policy "Partners update ngo_assignments" on public.ngo_assignments
  for update to authenticated
  using (
    public.is_coordinator()
    or (public.is_response_partner() and owner_user_id = auth.uid())
  )
  with check (
    public.is_coordinator()
    or (public.is_response_partner() and owner_user_id = auth.uid())
  );

drop policy if exists "Demo delete ngo_assignments" on public.ngo_assignments;
drop policy if exists "Partners delete ngo_assignments" on public.ngo_assignments;
create policy "Partners delete ngo_assignments" on public.ngo_assignments
  for delete to authenticated
  using (
    public.is_coordinator()
    or (public.is_response_partner() and owner_user_id = auth.uid())
  );

-- Volunteer Profiles:
--   * Authenticated response partners can read team roster availability.
--   * Partners can insert/update only their own profile (`owner_user_id = auth.uid()`);
--     Coordinators/Admins can manage any profile.
drop policy if exists "Public read volunteer_profiles" on public.volunteer_profiles;
drop policy if exists "Partners read volunteer_profiles" on public.volunteer_profiles;
create policy "Partners read volunteer_profiles" on public.volunteer_profiles
  for select to authenticated
  using (public.is_response_partner());

drop policy if exists "Demo upsert volunteer_profiles" on public.volunteer_profiles;
drop policy if exists "Partners insert volunteer_profiles" on public.volunteer_profiles;
create policy "Partners insert volunteer_profiles" on public.volunteer_profiles
  for insert to authenticated
  with check (
    public.is_coordinator()
    or (public.is_response_partner() and owner_user_id = auth.uid())
  );

drop policy if exists "Demo update volunteer_profiles" on public.volunteer_profiles;
drop policy if exists "Partners update volunteer_profiles" on public.volunteer_profiles;
create policy "Partners update volunteer_profiles" on public.volunteer_profiles
  for update to authenticated
  using (
    public.is_coordinator()
    or (public.is_response_partner() and owner_user_id = auth.uid())
  )
  with check (
    public.is_coordinator()
    or (public.is_response_partner() and owner_user_id = auth.uid())
  );

-- ============================================================================
-- 10. Safe Security-Definer RPCs for Public Report Deduplication & Confirmations
-- ============================================================================
-- Allows anonymous & offline-outbox report submissions to deduplicate cleanly
-- on `client_uuid` (ON CONFLICT DO NOTHING) and receive the masked public view
-- row back without needing SELECT or UPDATE privileges on base `public.reports`.
create or replace function public.submit_public_report(
  p_id text,
  p_client_uuid text,
  p_mode text,
  p_district_id text,
  p_district_name text,
  p_corridor_or_block text,
  p_locality text,
  p_coordinates_lat double precision,
  p_coordinates_lng double precision,
  p_category text,
  p_severity text,
  p_description text,
  p_affected_people_count integer,
  p_vulnerability_tags text[],
  p_assistance_needs text[],
  p_contact_phone text,
  p_reporter_name text,
  p_reporting_for_others boolean,
  p_created_at timestamptz default now()
)
returns setof public.reports_public
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mode = 'HELP_REQUEST' and coalesce(array_length(p_assistance_needs, 1), 0) = 0 then
    raise exception 'Select at least one type of assistance needed.';
  end if;

  insert into public.reports (
    id,
    client_uuid,
    mode,
    district_id,
    district_name,
    corridor_or_block,
    locality,
    coordinates_lat,
    coordinates_lng,
    category,
    severity,
    description,
    affected_people_count,
    vulnerability_tags,
    assistance_needs,
    contact_phone,
    reporter_name,
    reporting_for_others,
    created_at,
    verification_status,
    assistance_status,
    confirmations,
    assigned_unit,
    internal_notes,
    merged_into_id,
    merged_report_ids,
    is_demo_data,
    is_stale,
    updated_at
  ) values (
    p_id,
    p_client_uuid,
    p_mode,
    p_district_id,
    p_district_name,
    p_corridor_or_block,
    p_locality,
    p_coordinates_lat,
    p_coordinates_lng,
    p_category,
    p_severity,
    p_description,
    p_affected_people_count,
    coalesce(p_vulnerability_tags, '{}'),
    coalesce(p_assistance_needs, '{}'),
    p_contact_phone,
    p_reporter_name,
    coalesce(p_reporting_for_others, false),
    coalesce(p_created_at, now()),
    'UNVERIFIED',
    'SUBMITTED',
    1,
    null,
    '[]'::jsonb,
    null,
    '{}',
    false,
    false,
    now()
  )
  on conflict (client_uuid) do nothing;

  return query
    select *
    from public.reports_public rp
    where rp.client_uuid = p_client_uuid
    limit 1;
end;
$$;

revoke all on function public.submit_public_report(
  text, text, text, text, text, text, text, double precision, double precision,
  text, text, text, integer, text[], text[], text, text, boolean, timestamptz
) from public;
grant execute on function public.submit_public_report(
  text, text, text, text, text, text, text, double precision, double precision,
  text, text, text, integer, text[], text[], text, text, boolean, timestamptz
) to anon, authenticated;

-- Atomic toggle for "+1 Confirm" scoped strictly to the caller's device token
create or replace function public.toggle_report_confirmation(
  p_report_id text,
  p_device_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_device_token is null or char_length(trim(p_device_token)) < 8 or char_length(trim(p_device_token)) > 128 then
    raise exception 'Invalid device token';
  end if;

  if not exists (select 1 from public.reports where id = p_report_id) then
    raise exception 'Report not found';
  end if;

  delete from public.confirmations
  where report_id = p_report_id
    and device_token = p_device_token;

  get diagnostics v_deleted = row_count;
  if v_deleted > 0 then
    return false;
  end if;

  insert into public.confirmations (report_id, device_token)
  values (p_report_id, p_device_token)
  on conflict (report_id, device_token) do nothing;

  return true;
end;
$$;

revoke all on function public.toggle_report_confirmation(text, text) from public;
grant execute on function public.toggle_report_confirmation(text, text) to anon, authenticated;

-- Returns only report IDs confirmed by the calling device token
create or replace function public.get_confirmed_report_ids(
  p_device_token text
)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(c.report_id), '{}'::text[])
  from public.confirmations c
  where c.device_token = p_device_token
    and char_length(trim(p_device_token)) between 8 and 128;
$$;

revoke all on function public.get_confirmed_report_ids(text) from public;
grant execute on function public.get_confirmed_report_ids(text) to anon, authenticated;

-- ============================================================================
-- 11. Demo Account Directory (read-only metadata table seeded in supabase/seed.sql)
-- ============================================================================
create table if not exists public.demo_account_directory (
  email text primary key,
  full_name text not null,
  organization_name text not null,
  role text not null check (role in ('NGO_MEMBER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN')),
  district_id text,
  is_demo_data boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.demo_account_directory enable row level security;

drop policy if exists "Public read demo_account_directory" on public.demo_account_directory;
create policy "Public read demo_account_directory"
  on public.demo_account_directory
  for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- 12. Realtime Publication
-- ============================================================================
do $$
begin
  alter publication supabase_realtime add table public.corridors;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.resources;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.advisories;
exception when duplicate_object then null; when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ngo_assignments;
exception when duplicate_object then null; when undefined_object then null;
end $$;
