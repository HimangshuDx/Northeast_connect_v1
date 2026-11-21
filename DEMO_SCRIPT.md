# Northeast Connect — 3-Minute Hackathon Demo Script (PS05)

**Total Runtime:** ~3 minutes  
**Recommended Prep Before Starting:**
- Open the app in Chrome (`npm run dev` or deployed/preview URL) at `1280x800` or larger.
- Keep Chrome DevTools ready if demonstrating real network offline mode, or use the built-in **Demo: simulate offline** toggle.
- Optionally open a second browser window side-by-side if `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` are configured to show live cross-device sync.

---

## 0:00 – 0:30 | Problem & Situation Board Overview
1. Start on **Situation Board** (`/`).
2. Point out the permanent **"Immediate danger? Call 112"** strip at the top and the **"Sample Demo Data"** badges so evaluators see honest data labeling immediately.
3. Select **Dima Hasao (Haflong)** or **Kamrup Metro (Guwahati)** from the district dropdown:
   - Show the 4 filtered KPI cards updating live.
   - Show the **3-Day Rainfall Indicator (Open-Meteo)** updating for the selected district with `Low / Medium / High` icon+text badges and *"Not an official forecast"* label.
   - Scroll briefly past **Disaster Advisories** (highlighting Verified vs Unverified + Expiry), **Lifeline Corridor Board** (NH-27 Landslide Blocked / Saraighat Passable), and the **Interactive Leaflet Map** (mentioning automatic offline directory fallback).

---

## 0:30 – 1:15 | Multilingual Emergency Access
1. Switch the header language selector from **English** to **Assamese (অসমীয়া)** (or **Hindi** / **Bengali**).
2. Show navigation, Situation Board headings, and Safety Guides translating cleanly.
3. Switch back to **English** (or keep Assamese if desired) and navigate to **Resources & Safety Guides** (`/resources`) for 10 seconds to show camp capacity status (`OPEN AVAILABLE` / `FULL`), click-to-call helplines, and offline Before/During/After checklists.

---

## 1:15 – 2:15 | Real Offline-First Queuing, Duplicate Hint & Auto-Sync
1. Toggle **Demo: simulate offline** in the sidebar (or switch Chrome DevTools Network to **Offline**).
2. Point out the amber banner: `"Simulated offline (demo helper)"` (or `"No internet connection"` when actually offline).
3. Click **Request Urgent Help** (`/report`).
4. In Step 1, select **Kamrup Metro (Guwahati)**, Block: `Anil Nagar`, Locality: `Zoo Road Tiniali`. Click **Next**.
5. In Step 2, select Category `Stranded Persons` (or `Flooding`) — if a recent matching report exists within 3 hours, point out the **Duplicate Hint** offering `+1 Confirm existing report`. Enter description and click **Next**.
6. In Step 3, enter phone & name, and click **Save on Device (Offline Outbox)**.
7. Highlight the honest confirmation screen: **"Saved on your device. Not yet sent."**, plus **Share via SMS** (noting *"Opens your SMS app. We cannot confirm delivery."*).
8. Open **My Outbox**, show the `PENDING` entry, then turn **Demo: simulate offline** OFF (or reconnect DevTools Network) — watch **auto-sync** deliver the queued report to the Situation Board without duplicates (`clientUuid` idempotent).

---

## 2:15 – 3:00 | Coordinator Desk Triage & Closing
1. Navigate to **Coordinator Desk** (`/coordinator`).
2. Click **Fill Demo PIN** (`2468`, clearly labeled *"demo PIN, not real security"*) and unlock.
3. Select the newly synced report in **Report Inbox**:
   - Show **1. Verification Status** (`VERIFIED`) managed independently from **2. Assistance Workflow** (`DISPATCHED`).
   - Assign `SDRF Team Alpha` and add a quick note.
4. Switch briefly to **Corridor Management**, update a corridor status, and show the **Audit History** tab logging every action.
5. Return to **Situation Board** (`/`) to show the verified & dispatched status live, and summarize:
   - Zero-config `LocalAdapter` out of the box + optional Supabase Postgres/Realtime backend, real PWA offline shell caching, and honest emergency UX.
