# Authentication & Role-Based Access Control (RBAC) Setup

Northeast Connect separates **open Citizen public-safety access** from **authenticated Response Partner & Disaster Coordination access**.

---

## 1. Access Architecture & Roles

| Role | Entry Path | Permitted Routes | Notes |
| --- | --- | --- | --- |
| `CITIZEN` (Guest) | **Continue as Citizen** (`/`) | `/board`, `/citizen`, `/report`, `/resources`, My Outbox | Zero login barrier; views masked `reports_public`, advisories, shelters, and `112` helplines; submits Quick SOS or hazard reports offline or online. |
| `NGO_MEMBER` | **Organization Login** (`/login`) | `/ngo` (+ Citizen routes) | Accesses Relief Operations Dashboard, verified help requests, and their own team assignments/profile. **Blocked from `/coordinator` and unmasked base `reports`.** |
| `VOLUNTEER` | **Organization Login** (`/login`) | `/ngo` (+ Citizen routes) | Accesses Relief Operations Dashboard & team availability. **Blocked from `/coordinator`.** |
| `COORDINATOR` | **Organization Login** (`/login`) | `/coordinator`, `/ngo` (+ Citizen routes) | Full Coordinator Desk triage, report verification, corridor/resource updates, unmasked caller contacts, and audit logs. |
| `ADMIN` | **Organization Login** (`/login`) | `/coordinator`, `/ngo` (+ Citizen routes) | Full Coordinator Desk access plus `organization_profiles` administration. |

> **Security Principle:** In live Supabase mode (`VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` set), **demo bypass is disabled**. Coordinator Desk and NGO Operations require real Supabase Auth sign-in (`supabase.auth.signInWithPassword()`), and Postgres RLS (`public.current_user_role()` / `public.is_coordinator()`) checks **either** `public.organization_profiles` (`is_active = true`) **or** server-signed JWT `auth.jwt() -> 'app_metadata' ->> 'role'`. Never trust client `user_metadata` or `sessionStorage` for permissions.

---

## 2. Environment Variables

Configure these public variables in `.env` (or your hosting provider's environment settings):

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_PUBLISHABLE_ANON_KEY"
```

Never place `service_role` keys or database passwords in frontend code or `VITE_*` variables.

---

## 3. Exact Steps to Create a Coordinator User & Set `app_metadata.role`

1. Run `supabase/schema.sql` in the **Supabase SQL Editor** (safe and idempotent to re-run).
2. *(Optional demo seed)* Run `supabase/seed.sql` for sample Northeast India advisories, corridors, reports, and resources.
3. In **Supabase Dashboard → Authentication → Users**, click **Add User → Create new user**:
   - Enter email (e.g., `coordinator@asdma-demo.org`) and a strong password, and keep **Auto Confirm User** checked.
   - Note the created user's `UUID` (`auth.users.id`).
4. Set `app_metadata.role` so the Supabase Auth JWT carries `"role": "COORDINATOR"` AND register the user in `public.organization_profiles` (run **SQL Option A** in the Supabase SQL Editor, or **Option B** with the Admin API from a trusted terminal):

### Option A — Supabase SQL Editor (recommended)

```sql
-- Replace UUID, email, and name with your created user's details:
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
       'role', 'COORDINATOR',
       'organization_name', 'Kamrup District Disaster Control Room',
       'district_id', 'kamrup-metro'
     )
where id = 'REPLACE_WITH_AUTH_USER_UUID';

insert into public.organization_profiles (
  user_id, email, full_name, organization_name, role, district_id, is_active
)
values (
  'REPLACE_WITH_AUTH_USER_UUID',
  'coordinator@asdma-demo.org',
  'Duty Coordinator',
  'Kamrup District Disaster Control Room',
  'COORDINATOR',
  'kamrup-metro',
  true
)
on conflict (user_id) do update
set role = excluded.role,
    organization_name = excluded.organization_name,
    is_active = true,
    updated_at = now();
```

*(For an NGO partner or volunteer instead, replace `'COORDINATOR'` with `'NGO_MEMBER'` or `'VOLUNTEER'`.)*

### Option B — Supabase Admin API (`service_role` from a trusted server/terminal only)

```bash
curl -X PUT "https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users/REPLACE_WITH_AUTH_USER_UUID" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"app_metadata": {"role": "COORDINATOR", "district_id": "kamrup-metro"}}'
```

*(Note: After updating `app_metadata` in Postgres or via the Admin API, sign out and sign back in so the user's JWT refreshes with the new claim.)*

5. For **Forgot Password** recovery links, add `${YOUR_APP_ORIGIN}/login?reset=1` (e.g., `http://localhost:3000/login?reset=1`) under **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**.

---

## 4. Zero-Config Local Mode (`Demo Only`)

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are **not** set, the app runs in local device-only mode (`LocalAdapter`) and `/login` enables three clearly marked **`DEMO ONLY`** accounts stored only in your browser:

| Demo account | Role |
| --- | --- |
| `demo.ngo@northeastconnect.demo` | `NGO_MEMBER` |
| `demo.volunteer@northeastconnect.demo` | `VOLUNTEER` |
| `demo.coordinator@northeastconnect.demo` | `COORDINATOR` |

When Supabase **is** configured, those demo bypass buttons are automatically disabled so every partner and coordinator login goes through real Supabase Auth + Postgres RLS.
