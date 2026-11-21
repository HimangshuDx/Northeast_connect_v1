-- Northeast Connect (PS05) — Supabase Postgres Schema
-- Run this file FIRST in the Supabase SQL Editor, then run supabase/seed.sql.
--
-- ============================================================================
-- SECURITY WARNING (HACKATHON PROTOTYPE RLS):
-- Policies below grant anon SELECT/INSERT/UPDATE on coordinator-managed tables
-- (reports, corridors, resources, audit_logs) so the hackathon demo works out
-- of the box without requiring user sign-up. Before any real deployment,
-- replace these permissive policies with Supabase Auth JWT role checks
-- (e.g., auth.jwt() ->> 'role' = 'coordinator') and restrict direct SELECT on
-- public.reports so only authenticated coordinators read unmasked phones.
-- ============================================================================

create extension if not exists pgcrypto;

-- 1. Disaster Advisories
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

-- 2. Lifeline Corridors
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

-- 3. Community Reports & Urgent Help Requests
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
  affected_people_count integer not null default 1 check (affected_people_count between 1 and 100000),
  vulnerability_tags text[] not null default '{}',
  assistance_needs text[] not null default '{}',
  contact_phone text not null check (char_length(trim(contact_phone)) between 10 and 25),
  reporter_name text not null check (char_length(trim(reporter_name)) between 2 and 100),
  reporting_for_others boolean not null default false,
  created_at timestamptz not null default now(),
  verification_status text not null default 'UNVERIFIED' check (verification_status in ('VERIFIED', 'UNVERIFIED', 'UNDER_REVIEW', 'REJECTED')),
  assistance_status text not null default 'SUBMITTED' check (assistance_status in ('SUBMITTED', 'ACCEPTED', 'DISPATCHED', 'RESOLVED')),
  confirmations integer not null default 1 check (confirmations >= 0),
  assigned_unit text,
  internal_notes jsonb not null default '[]'::jsonb,
  merged_into_id text,
  merged_report_ids text[] not null default '{}',
  is_demo_data boolean not null default false,
  is_stale boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_reports_district_created on public.reports (district_id, created_at desc);

-- 4. Community "+1 Confirm" Votes (one per device token per report)
create table if not exists public.confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  device_token text not null,
  created_at timestamptz not null default now(),
  unique (report_id, device_token)
);

-- Keep reports.confirmations counter atomic on insert/delete
create or replace function public.handle_confirmation_change()
returns trigger
language plpgsql
security definer
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

-- 5. Emergency Resources
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

-- 6. Coordinator Audit Logs
create table if not exists public.audit_logs (
  id text primary key,
  timestamp timestamptz not null default now(),
  actor text not null check (char_length(trim(actor)) between 2 and 80),
  action_type text not null check (action_type in ('VERIFY_REPORT', 'ASSISTANCE_UPDATE', 'ASSIGN_UNIT', 'ADD_NOTE', 'MERGE_REPORT', 'DELETE_REPORT', 'UPDATE_CORRIDOR', 'UPDATE_RESOURCE')),
  target_label text not null,
  summary text not null,
  is_demo_data boolean not null default false,
  created_at timestamptz not null default now()
);

-- Public masked view for reports (hides trailing 5 phone digits from public Situation Board)
create or replace view public.reports_public
with (security_invoker = on)
as
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
from public.reports;

grant select on public.reports_public to anon, authenticated;

-- Enable Row Level Security
alter table public.advisories enable row level security;
alter table public.corridors enable row level security;
alter table public.reports enable row level security;
alter table public.confirmations enable row level security;
alter table public.resources enable row level security;
alter table public.audit_logs enable row level security;

-- Public Read Policies
drop policy if exists "Public read advisories" on public.advisories;
create policy "Public read advisories" on public.advisories for select to anon, authenticated using (true);

drop policy if exists "Public read corridors" on public.corridors;
create policy "Public read corridors" on public.corridors for select to anon, authenticated using (true);

drop policy if exists "Public read reports" on public.reports;
create policy "Public read reports" on public.reports for select to anon, authenticated using (true);

drop policy if exists "Public read confirmations" on public.confirmations;
create policy "Public read confirmations" on public.confirmations for select to anon, authenticated using (true);

drop policy if exists "Public read resources" on public.resources;
create policy "Public read resources" on public.resources for select to anon, authenticated using (true);

drop policy if exists "Public read audit_logs" on public.audit_logs;
create policy "Public read audit_logs" on public.audit_logs for select to anon, authenticated using (true);

-- Public Insert Policies (Community Reports & +1 Confirmations)
drop policy if exists "Public insert reports" on public.reports;
create policy "Public insert reports" on public.reports for insert to anon, authenticated with check (true);

drop policy if exists "Public insert confirmations" on public.confirmations;
create policy "Public insert confirmations" on public.confirmations for insert to anon, authenticated with check (true);

drop policy if exists "Public delete own confirmations" on public.confirmations;
create policy "Public delete own confirmations" on public.confirmations for delete to anon, authenticated using (true);

-- Demo-Only Coordinator Write Policies (Replace with Auth role policies in production)
drop policy if exists "Demo update reports" on public.reports;
create policy "Demo update reports" on public.reports for update to anon, authenticated using (true) with check (true);

drop policy if exists "Demo delete reports" on public.reports;
create policy "Demo delete reports" on public.reports for delete to anon, authenticated using (true);

drop policy if exists "Demo update corridors" on public.corridors;
create policy "Demo update corridors" on public.corridors for update to anon, authenticated using (true) with check (true);

drop policy if exists "Demo update resources" on public.resources;
create policy "Demo update resources" on public.resources for update to anon, authenticated using (true) with check (true);

drop policy if exists "Demo insert audit_logs" on public.audit_logs;
create policy "Demo insert audit_logs" on public.audit_logs for insert to anon, authenticated with check (true);

-- 7. NGO / Volunteer Task Assignments (separate from Coordinator official dispatch)
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
  is_demo_data boolean not null default false
);

create index if not exists idx_ngo_assignments_report on public.ngo_assignments (report_id);

-- 8. NGO / Volunteer Availability & Field Inventory Profiles
create table if not exists public.volunteer_profiles (
  id text primary key,
  name text not null check (char_length(trim(name)) between 2 and 80),
  organization text not null check (char_length(trim(organization)) between 2 and 100),
  district_id text not null,
  capability text not null check (capability in ('Boat Rescue', 'Medical Aid', 'Food & Water Distribution', 'Shelter & Evacuation', 'Road & Debris Support')),
  availability text not null default 'AVAILABLE' check (availability in ('AVAILABLE', 'BUSY', 'OFFLINE')),
  team_size integer not null default 1 check (team_size between 1 and 500),
  resource_inventory text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.ngo_assignments enable row level security;
alter table public.volunteer_profiles enable row level security;

drop policy if exists "Public read ngo_assignments" on public.ngo_assignments;
create policy "Public read ngo_assignments" on public.ngo_assignments for select to anon, authenticated using (true);

drop policy if exists "Demo write ngo_assignments" on public.ngo_assignments;
create policy "Demo write ngo_assignments" on public.ngo_assignments for insert to anon, authenticated with check (true);

drop policy if exists "Demo update ngo_assignments" on public.ngo_assignments;
create policy "Demo update ngo_assignments" on public.ngo_assignments for update to anon, authenticated using (true) with check (true);

drop policy if exists "Demo delete ngo_assignments" on public.ngo_assignments;
create policy "Demo delete ngo_assignments" on public.ngo_assignments for delete to anon, authenticated using (true);

drop policy if exists "Public read volunteer_profiles" on public.volunteer_profiles;
create policy "Public read volunteer_profiles" on public.volunteer_profiles for select to anon, authenticated using (true);

drop policy if exists "Demo upsert volunteer_profiles" on public.volunteer_profiles;
create policy "Demo upsert volunteer_profiles" on public.volunteer_profiles for insert to anon, authenticated with check (true);

drop policy if exists "Demo update volunteer_profiles" on public.volunteer_profiles;
create policy "Demo update volunteer_profiles" on public.volunteer_profiles for update to anon, authenticated using (true) with check (true);

-- Enable Realtime broadcasts on core situation tables
do $$
begin
  alter publication supabase_realtime add table public.reports;
exception when duplicate_object then null; when undefined_object then null;
end $$;

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

