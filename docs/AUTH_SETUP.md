# Authentication & Role-Based Access Control (RBAC) Setup

Northeast Connect separates **open Citizen public-safety access** from **authenticated Response Partner & Disaster Coordination access**.

---

## 1. Access Architecture & Roles

| Role | Entry Path | Permitted Routes | Notes |
| --- | --- | --- | --- |
| `CITIZEN` (Guest) | **Continue as Citizen** (`/`) | `/board`, `/citizen`, `/report`, `/resources`, My Outbox | Zero login barrier; can view advisories, shelters, 112 helplines, and submit Quick SOS / hazard reports offline or online. |
| `NGO_MEMBER` | **Organization Login** (`/login`) | `/ngo` (+ Citizen routes) | Accesses Relief Operations Dashboard, verified help requests, and team inventory. **Explicitly blocked from `/coordinator`.** |
| `VOLUNTEER` | **Organization Login** (`/login`) | `/ngo` (+ Citizen routes) | Accesses Relief Operations Dashboard & team availability. **Explicitly blocked from `/coordinator`.** |
| `COORDINATOR` | **Organization Login** (`/login`) | `/coordinator`, `/ngo` (+ Citizen routes) | Full Coordinator Desk triage, verification, corridor/resource updates, and audit logs. |
| `ADMIN` | **Organization Login** (`/login`) | `/coordinator`, `/ngo` (+ Citizen routes) | Administrative clearance including `organization_profiles` management. |

> **Security Principle:** In live Supabase mode, roles are never trusted from browser state. After `supabase.auth.signInWithPassword()`, the client queries `public.organization_profiles` (`is_active = true`) and Postgres Row Level Security (`public.current_user_role()`) enforces database-level authorization.

---

## 2. Environment Variables

Configure these public variables in `.env` (or your hosting provider's environment settings):

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_PUBLISHABLE_ANON_KEY"
```

Never place `service_role` keys or database passwords in frontend code or `VITE_*` variables.

---

## 3. Provisioning Database Schema & Real Organization Users

1. Run `supabase/schema.sql` in the **Supabase SQL Editor**. This creates `public.organization_profiles`, `public.current_user_role()`, `public.is_response_partner()`, and `public.is_coordinator_or_admin()`.
2. (Optional demo seed) Run `supabase/seed.sql` for regional Northeast India sample advisories, corridors, and resources.
3. In **Supabase Dashboard → Authentication → Users**, click **Add User** (or invite user via email) for each authorized partner.
   - Open self-registration is intentionally disabled in the UI.
4. Copy each created user's `UUID` (`auth.users.id`) and assign their authoritative role in `public.organization_profiles`:

```sql
-- Example: Provision an NGO Member (allowed on /ngo, denied on /coordinator)
insert into public.organization_profiles (user_id, email, full_name, organization_name, role, district_id, is_active)
values (
  'REPLACE_WITH_AUTH_USER_UUID',
  'ngo.lead@example.org',
  'Ananya Das',
  'Brahmaputra River Relief Collective',
  'NGO_MEMBER',
  'kamrup-metro',
  true
);

-- Example: Provision a Disaster Coordinator (allowed on /coordinator and /ngo)
insert into public.organization_profiles (user_id, email, full_name, organization_name, role, district_id, is_active)
values (
  'REPLACE_WITH_AUTH_USER_UUID',
  'coordinator@asdma-demo.org',
  'Duty Coordinator',
  'Kamrup District Disaster Control Room',
  'COORDINATOR',
  'kamrup-metro',
  true
);
```

5. For **Forgot Password** recovery links, add `${YOUR_APP_ORIGIN}/login?reset=1` (e.g., `http://localhost:3000/login?reset=1`) under **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**.
6. Before real production launch, uncomment the **PRODUCTION HARDENING SQL** block at the bottom of `supabase/schema.sql` so only `COORDINATOR` / `ADMIN` sessions read unmasked `public.reports` and modify corridors, resources, and audit logs.

---

## 4. Hackathon Demo Mode (Zero-Config Evaluation)

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured (or when evaluating locally), `/login` displays a clearly separated **`DEMO MODE`** section with three sample identities (also seeded in `public.demo_account_directory` and synced to `public.organization_profiles` via `supabase/seed.sql` once created in Supabase Auth):

| Demo account | Role |
| --- | --- |
| `demo.ngo@northeastconnect.demo` | `NGO_MEMBER` |
| `demo.volunteer@northeastconnect.demo` | `VOLUNTEER` |
| `demo.coordinator@northeastconnect.demo` | `COORDINATOR` |

Active demo sessions display an explicit **`DEMO MODE`** badge across the header, sidebar, and dashboards so evaluators never confuse demo accounts with live Supabase authentication.

