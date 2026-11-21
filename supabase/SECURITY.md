# Northeast Connect — Database & Access Security Notes

This file explains in plain language how `supabase/schema.sql` protects citizen phone numbers, reporter identities, and coordinator actions when connected to Supabase.

---

## 1. What Is Protected

1. **Caller phone numbers, reporter names, and internal notes are hidden from the public (`reports_public` view vs `public.reports` table).**
   - Anonymous (`anon`) and non-coordinator users have **zero `SELECT` permission** on the base `public.reports` table.
   - Public Situation Board and NGO Operations read only from the `public.reports_public` view, which:
     - Masks `contact_phone` down to its trailing characters replaced with `XXXXX` (e.g., `+91-98640-XXXXX`).
     - Omits `reporter_name` and `internal_notes` completely.
   - Only authenticated users verified as `COORDINATOR` or `ADMIN` can query unmasked `public.reports` for callback and dispatch triage.

2. **Accepted trade-off: Supabase `"Security Definer View"` lint warning on `reports_public`.**
   - `public.reports_public` is intentionally created **without** `security_invoker = on` so the view executes with its owner's privileges while filtering out sensitive columns.
   - Because `anon` has no `SELECT` policy or table grant on `public.reports`, bypassing `reports_public` via `/rest/v1/reports` returns permission denied / empty error instead of caller phone numbers.
   - When you run the Supabase Database Linter, it will warn about `reports_public` not using `security_invoker`. That warning is an **intentional, accepted trade-off** documented here.

3. **Write permissions are locked down by role.**
   - **`public.reports`**: Anyone (including `anon`) can `INSERT` a new incident or help request, **only** if workflow fields start in safe defaults (`verification_status = 'UNVERIFIED'`, `assistance_status = 'SUBMITTED'`, `confirmations = 1`, `assigned_unit is null`, `internal_notes = '[]'`, `is_demo_data = false`). Only `COORDINATOR` / `ADMIN` can `UPDATE` or `DELETE` reports.
   - **`public.corridors`, `public.resources`, `public.advisories`**: Publicly readable; only `COORDINATOR` / `ADMIN` can insert, update, or delete.
   - **`public.audit_logs`**: Only `COORDINATOR` / `ADMIN` can read or insert audit trail records.
   - **`public.ngo_assignments` & `public.volunteer_profiles`**: Only authenticated `NGO_MEMBER`, `VOLUNTEER`, `COORDINATOR`, or `ADMIN` sessions can read; NGO/volunteer accounts can only modify rows where `owner_user_id = auth.uid()`.
   - **`public.confirmations`**: Direct unrestricted `DELETE` by `anon` was removed. Duplicate "+1 Confirm" votes are handled through `toggle_report_confirmation(report_id, device_token)` and `get_confirmed_report_ids(device_token)` `SECURITY DEFINER` RPCs (or matching `x-device-token` request header).

4. **Strict input constraints on database columns.**
   - `affected_people_count` must be between `1` and `500`.
   - `contact_phone` must match `^[+0-9() -]{10,25}$` and contain 10–15 digits.
   - Categories, severities, passability statuses, capacity statuses, vulnerability tags, and assistance needs are constrained to explicit allow-lists and length caps.
   - Duplicate offline retries deduplicate cleanly on `client_uuid` via `submit_public_report(...)` (`ON CONFLICT (client_uuid) DO NOTHING`) without giving `anon` `SELECT` or `UPDATE` rights on `public.reports`.

5. **No demo bypass when live Supabase is connected.**
   - When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured, the client-side `DEMO ONLY` buttons are disabled. Coordinator Desk and NGO Operations require real Supabase Auth credentials validated via `public.organization_profiles` or server-assigned JWT `app_metadata.role`.

---

## 2. How to Verify RLS Yourself

Run the included script against your Supabase project URL and publishable anon key:

```bash
export SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
export SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
# Optional: test real coordinator login + verification update:
export COORD_EMAIL="coordinator@your-org.org"
export COORD_PASSWORD="your-password"

./supabase/test-rls.sh
```

---

## 3. Remaining Limitations & Operational Notes

- **Unauthenticated spam / rate limiting:** Public emergency reporting intentionally works without an account so stranded citizens are never blocked by login. Postgres RLS enforces field formats and bounds, but **rate-limiting / CAPTCHA / IP throttling** must still be enabled at the Supabase Auth/API gateway or Edge proxy layer before wide public deployment.
- **Public location precision:** Incident locality, district, corridor, description, and optional GPS coordinates submitted on the board are visible in `reports_public` so nearby citizens and responders can see hazards. Do not include private apartment numbers or sensitive medical IDs in descriptions.
- **Coordinator password hygiene:** Provision coordinators with strong passwords and refresh their session after changing `app_metadata.role`. Never place `service_role` keys in `.env` or any `VITE_*` variable.
