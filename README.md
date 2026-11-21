# Northeast Connect

**Stay Informed. Stay Connected. Stay Prepared.**

**Live Demo:** https://northeastconnect-gamma.vercel.app/

Northeast Connect is an offline-first, community-driven disaster management and emergency coordination web application designed for Northeast India (Promptwares Hackathon Project — PS05). It helps residents, travelers, volunteers, and emergency coordinators monitor flood and landslide advisories, track lifeline highway/bridge/ferry passability, submit hazard or urgent rescue requests while offline, and coordinate field response.

> **Prototype & Demo Data Notice:** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured, this app runs locally on your device (`This device only (demo mode)`) with **Sample Demo Data** across Northeast Indian districts. When Supabase is configured (`Shared database (Supabase)`), demo bypass is disabled and Postgres Row Level Security enforces role-based access control.

---

## Screenshots

Target screenshots directory: [`docs/screenshots/`](docs/screenshots/README.md)

| Screen | File | What It Shows |
| --- | --- | --- |
| Situation Board | `docs/screenshots/01-situation-board.png` | Disaster advisories, Lifeline Corridor table/cards, and Community Reports feed |
| Report / Request Help | `docs/screenshots/02-report-form.png` | Quick SOS & 3-Step Hazard / Urgent Help request workflow |
| Outbox Offline State | `docs/screenshots/03-outbox-offline.png` | My Outbox drawer queuing failed/offline reports (*"Saved on your device. Not yet sent."*) |
| Map With Route | `docs/screenshots/04-map-route.png` | Interactive Leaflet map with `"Locate me"` GPS dot and route preview |
| Coordinator Desk | `docs/screenshots/05-coordinator-desk.png` | Split Verification vs. Assistance Workflow triage and audit logs |

---

## Core Features

### 1. Role Selection & Organization Portal (`/`, `/login`)
- **Role Selection Landing Page (`/`):** Clear one-line overview and entry choice between **I'm a Citizen** (direct **Request help** and **View situation** actions with zero sign-up barriers) and **I'm a Response Partner** (authorized portal login).
- **Organization & Response Partner Portal (`/login`):** Supabase email/password authentication with show/hide password toggle, **Remember Me** device preference, **Forgot Password** email recovery (`resetPasswordForEmail`), and a clearly labeled **`DEMO ONLY`** local evaluation panel (`NGO_MEMBER`, `VOLUNTEER`, `COORDINATOR`) that is automatically disabled when live Supabase is connected.
- **Role-Based Access Control (RBAC):** Authoritative role verification via `public.organization_profiles` and server-assigned JWT `app_metadata.role`. `NGO_MEMBER` and `VOLUNTEER` access Relief Operations (`/ngo`) and are **strictly denied** access to Coordinator Desk (`/coordinator`), which requires `COORDINATOR` or `ADMIN`. See [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md) and [`supabase/SECURITY.md`](supabase/SECURITY.md).

### 2. Situation Board (`/board`, `/citizen`)
- **Permanent 112 Emergency Strip:** Clickable `tel:112` call action and quick link to **Request Urgent Help**.
- **Situation Overview:** Live-filtered statistics for Active Advisories, Blocked Corridors, Open Help Requests, and Available Resources across 10+ Northeast districts.
- **Disaster Advisories:** Severity-coded bulletins (`CRITICAL`, `WARNING`, `WATCH`) showing instructions, issued/expiry timestamps, source attribution, verification state, and stale-data warnings.
- **Lifeline Corridor Board:** Searchable and filterable status board (`PASSABLE`, `SINGLE LANE`, `LANDSLIDE BLOCKED`, `SUBMERGED`, `CLOSED`, `UNKNOWN`) rendered as a table on desktop and cards on mobile.
- **Interactive Regional Map:** Built with **Leaflet** and **OpenStreetMap** featuring layer filters (`Incidents`, `Corridors`, `Camps & Medical`), typed markers, a mobile-collapsible legend, **"Locate me"** GPS positioning, **OSRM route preview** on marker click, and automatic/manual fallback to a structured **Offline Location Directory** when offline or if map tiles fail to load. Items lacking coordinates are safely listed under **No coordinates available**.
- **Community Reports Feed:** Searchable incident cards with vulnerability/assistance details and interactive **+1 Confirm** endorsement counts.

### 3. Report / Request Help (`/report`)
- **Dual Mode:** Choose **Quick SOS (1-Step)**, **Report a Hazard**, or **Request Urgent Help (3-Step)**.
- **3-Step Guided Form:**
  1. **Location:** District, Block/Highway Corridor, Locality/Landmark, optional browser GPS coordinate capture, and *"I am reporting for others"* toggle.
  2. **Situation & Needs:** Category, severity level, affected people count (`1–500`), vulnerability tags (`Elderly`, `Infants`, `Pregnant`, `Medical Need`, `Disabled`), and assistance needs (`Rescue`, `Medical`, `Food / Water`, `Shelter`).
  3. **Contact & Review:** Inline phone/reporter validation and pre-submission summary.
- **Offline-First Confirmation & Deduplication:** When offline (or if a server request fails), submissions save locally with *"Saved on your device. Not yet sent."* and retry using an idempotent `client_uuid` key.

### 4. My Outbox (Slide-Over Drawer)
- Tracks `Pending`, `Syncing`, `Synced`, and `Failed` submissions stored locally on the device.
- Supports **Retry**, **Sync Queued**, **Edit** (re-opens in the form), **Delete** (with confirmation dialog), and **Share via SMS** (`sms:?body=...` URI with explicit delivery disclaimer).

### 5. Resources, Helplines & Safety Guides (`/resources`)
- **Resource Directory:** Filterable by category (`Relief Camps`, `Medical Posts`, `Water / Ration Points`, `Boat Rescue Points`), district, and keyword search, showing capacity statuses (`OPEN AVAILABLE`, `NEAR CAPACITY`, `FULL`, `TEMPORARILY CLOSED`, `UNKNOWN`), supplies, landmarks, and click-to-call buttons.
- **Emergency Helplines:** Click-to-call cards for `112`, `1070`, `1077`, `108`, `101`, and `NDRF Control Room`.
- **Multilingual Safety Guides:** Offline-ready **Before / During / After** checklists for **Flood Safety**, **Landslide Safety**, and **Earthquake Safety**.

### 6. Relief Operations (`/ngo`) & Coordinator Desk (`/coordinator`)
- **Relief Operations Dashboard (`/ngo`):** Protected for authenticated `NGO_MEMBER`, `VOLUNTEER`, `COORDINATOR`, and `ADMIN` roles. Supports priority-sorted verified assistance requests, task pledges (`PLEDGED` → `EN_ROUTE` → `ON_SITE` → `RELIEF_DELIVERED`), volunteer availability, and field inventory.
- **Coordinator Desk (`/coordinator`):** Protected exclusively for `COORDINATOR` and `ADMIN` roles. Separates **Verification Status** (`UNVERIFIED`, `UNDER REVIEW`, `VERIFIED`, `REJECTED`) from **Assistance Workflow** (`SUBMITTED`, `ACCEPTED`, `DISPATCHED`, `RESOLVED`), manages corridors/resources, views unmasked caller contacts, and logs audit history.

### 7. Multilingual Support & Dual Theme
- **4 Languages:** Global language selector supporting **English (default)**, **Assamese (অসমীয়া)**, **Hindi (हिन्दी)**, and **Bengali (বাংলা)** across the Role Selection portal, navigation, pages, controls, and Safety Guides, persisted in `localStorage`.
- **Dark & Light Themes:** Deep navy/slate dark theme (default) and high-contrast light theme toggleable across all screens.
- **Data Source Indicator & Offline Simulation:** Visible **Data source** badge (`Shared database (Supabase)` vs `This device only (demo mode)`) plus a **Simulate Offline** control in the sidebar.

---

## Known Limitations

- **Browser Geolocation requires HTTPS:** The **"Locate me"** map button and GPS form capture rely on `navigator.geolocation`, which modern browsers block on insecure `http://` origins (except `http://localhost`). Deploy over HTTPS in production.
- **Public OSRM demo server for route previews:** Driving/walking routes on the map call the free public OSRM demo endpoint (`https://router.project-osrm.org/route/v1/`). It is unsuitable for heavy production traffic and requires network connectivity. When offline or unreachable, the map falls back to a dashed straight line and Haversine distance (`"Straight-line distance only. Road route unavailable."`).
- **Routes do not account for live road closures:** As displayed in the map notice, any plotted route is a suggestion only and does **not** automatically reroute around flooded, landslide-blocked, or closed corridors. Always verify the **Lifeline Corridor Board** and local authorities.
- **Local demo mode stays on one device:** Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, data is persisted in `localStorage` on your device only (`This device only (demo mode)`) and is not shared across devices or browsers.
- **Anonymous submission rate limiting:** Anonymous citizens can report emergencies without signing in. Postgres RLS enforces column allow-lists, formats, and safe defaults, but edge/API rate limiting (e.g., Supabase Edge Functions or reverse-proxy throttling) is still recommended before broad public launch.
- **SMS sharing cannot verify delivery:** Clicking **Share via SMS** opens the device's native SMS composer via `sms:?body=...`; the web app cannot detect whether the text was actually sent.

---

## How AI Tools Were Used

AI coding assistance was used iteratively as an engineering pair-programmer for scaffolding UI layouts, translating safety guides and interface labels across English, Assamese, Hindi, and Bengali, writing Supabase Postgres RLS policies and migration SQL, and debugging Leaflet/PWA offline edge cases. All architectural choices, database security rules (`supabase/schema.sql`, `supabase/test-rls.sh`), validation constraints, and build/typecheck passes were reviewed and verified by the development workflow.

---

## Architecture & Project Structure

UI components are decoupled from storage via a `dataService` facade (`DataAdapter` interface) and `authService` (`Supabase Auth` + `organization_profiles` / JWT `app_metadata.role` RBAC + local-only Demo Mode), allowing zero-config local execution or full Supabase Postgres + Auth operation.

```text
docs/
├── AUTH_SETUP.md       # Supabase Auth, coordinator app_metadata.role, & RBAC setup guide
└── screenshots/        # Target screenshot directory (see docs/screenshots/README.md)
supabase/
├── schema.sql          # Idempotent Postgres schema, masked reports_public view, RLS & RPCs
├── seed.sql            # Regional Northeast India sample seed data
├── SECURITY.md         # Plain-language database security overview & accepted trade-offs
└── test-rls.sh         # Automated curl RLS verification script
src/
├── components/         # Reusable UI components (AppLayout, ProtectedRoute, EmergencyStrip,
│                       # OfflineBanner, TrustBadge, SeverityBadge, StatusPill, IncidentCard,
│                       # OutboxDrawer, InteractiveMap, ConfirmationDialog, etc.)
├── context/            # AppContext (authSession, RBAC helpers, theme, language, district, data)
├── data/               # Sample Northeast India demo records, translations, & safety guides
├── pages/              # RoleSelectionPage, OrganizationLoginPage, SituationBoardPage,
│                       # ReportHelpPage, ResourcesGuidesPage, NgoOperationsPage, CoordinatorDeskPage
├── services/           # authService.ts, supabaseClient.ts, dataAdapter.ts, localAdapter.ts,
│                       # supabaseAdapter.ts, dataService.ts
├── types/              # TypeScript domain & auth/RBAC interfaces
├── utils/              # Timestamp formatters, validation, staleness checks, & SMS payload builder
├── App.tsx             # React Router routes and ProtectedRoute RBAC guards
├── index.css           # Tailwind CSS v4 configuration, dark variant, fonts, and Leaflet styles
└── main.tsx            # Application entry point, PWA update handler & ErrorBoundary
```

---

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router (`react-router-dom`)
- **Backend / Auth (Optional):** Supabase Postgres + Row Level Security + Supabase Auth
- **Offline PWA:** `vite-plugin-pwa` (Workbox service worker + Web App Manifest)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** Lucide React (`lucide-react`)
- **Maps:** Leaflet (`leaflet`) + OpenStreetMap tiles (with offline directory fallback)

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation & Development

```bash
# Install dependencies deterministically
npm ci

# Start the development server (port 3000)
npm run dev
```

### Build & Typecheck

```bash
# Run TypeScript typechecking
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Demo Accounts & Roles

When evaluating **Organization Login** (`/login`) in **Local Demo Only** mode (`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` unset), the following role assignments apply:

| Demo account | Role | Access Scope |
| --- | --- | --- |
| `demo.ngo@northeastconnect.demo` | `NGO_MEMBER` | Relief Operations Dashboard (`/ngo`); blocked from Coordinator Desk (`/coordinator`). |
| `demo.volunteer@northeastconnect.demo` | `VOLUNTEER` | Relief Operations Dashboard (`/ngo`); blocked from Coordinator Desk (`/coordinator`). |
| `demo.coordinator@northeastconnect.demo` | `COORDINATOR` | Coordinator Desk (`/coordinator`) and Relief Operations Dashboard (`/ngo`). |

When connected to live Supabase, those demo buttons are disabled; provision real users via [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md).

