# Northeast Connect

**Stay Informed. Stay Connected. Stay Prepared.**

Northeast Connect is an offline-first, community-driven disaster management and emergency coordination web application designed for Northeast India (Promptwares Hackathon Project — PS05). It helps residents, travelers, volunteers, and emergency coordinators monitor flood and landslide advisories, track lifeline highway/bridge/ferry passability, submit hazard or urgent rescue requests while offline, and coordinate field response.

> **Prototype & Demo Data Notice:** This prototype runs locally with realistic **Sample Demo Data** across Northeast Indian districts. All sample records are explicitly badged as `Sample Demo Data`, and simulated offline/SMS features clearly disclose their boundaries (e.g., *"Opens your SMS app. We cannot confirm delivery."*).

---

## Core Features

### 1. Role Selection & Organization Portal (`/`, `/login`)
- **Role Selection Landing Page (`/`):** Clear entry choice between **I'm a Citizen** (instant guest access with zero sign-up barriers) and **I'm a Response Partner** (authorized portal login).
- **Organization & Response Partner Portal (`/login`):** Supabase email/password authentication with show/hide password toggle, **Remember Me** device preference, **Forgot Password** email recovery (`resetPasswordForEmail`), and a clearly labeled **`DEMO MODE`** evaluation panel (`NGO_MEMBER`, `VOLUNTEER`, `COORDINATOR`).
- **Role-Based Access Control (RBAC):** Authoritative role verification via `public.organization_profiles`. `NGO_MEMBER` and `VOLUNTEER` access Relief Operations (`/ngo`) and are **strictly denied** access to Coordinator Desk (`/coordinator`), which requires `COORDINATOR` or `ADMIN`. See [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md).

### 2. Situation Board (`/board`, `/citizen`)
- **Permanent 112 Emergency Strip:** Clickable `tel:112` call action and quick link to **Request Urgent Help**.
- **Situation Overview:** Live-filtered statistics for Active Advisories, Blocked Corridors, Open Help Requests, and Available Resources across 10+ Northeast districts.
- **Disaster Advisories:** Severity-coded bulletins (`CRITICAL`, `WARNING`, `WATCH`) showing instructions, issued/expiry timestamps, source attribution, verification state, and stale-data warnings.
- **Lifeline Corridor Board:** Searchable and filterable status board (`PASSABLE`, `SINGLE LANE`, `LANDSLIDE BLOCKED`, `SUBMERGED`, `CLOSED`, `UNKNOWN`) rendered as a table on desktop and cards on mobile.
- **Interactive Regional Map:** Built with **Leaflet** and **OpenStreetMap** featuring layer filters (`Incidents`, `Corridors`, `Camps & Medical`), custom markers, popups, legend, and automatic/manual fallback to a structured **Offline Location Directory** when offline or if map tiles fail to load.
- **Community Reports Feed:** Searchable incident cards with vulnerability/assistance details and interactive **+1 Confirm** endorsement counts.

### 3. Report / Request Help (`/report`)
- **Dual Mode:** Choose **Quick SOS (1-Step)**, **Report a Hazard**, or **Request Urgent Help (3-Step)**.
- **3-Step Guided Form:**
  1. **Location:** District, Block/Highway Corridor, Locality/Landmark, optional browser GPS coordinate capture, and *"I am reporting for others"* toggle.
  2. **Situation & Needs:** Category, severity level, affected people count, vulnerability tags (`Elderly`, `Infants`, `Pregnant`, `Medical Need`, `Disabled`), and assistance needs (`Rescue`, `Medical`, `Food / Water`, `Shelter`).
  3. **Contact & Review:** Inline phone/reporter validation and pre-submission summary.
- **Offline-First Confirmation:** When offline (or using the **Simulate Offline** toggle), submissions display *"Saved on your device. Not yet sent."* and are queued in **My Outbox**.

### 4. My Outbox (Slide-Over Drawer)
- Tracks `Pending`, `Syncing`, `Synced`, and `Failed` submissions stored locally on the device.
- Supports **Retry**, **Sync Queued**, **Edit** (re-opens in the form), **Delete** (with confirmation dialog), and **Share via SMS** (`sms:?body=...` URI with explicit delivery disclaimer).

### 5. Resources, Helplines & Safety Guides (`/resources`)
- **Resource Directory:** Filterable by category (`Relief Camps`, `Medical Posts`, `Water / Ration Points`, `Boat Rescue Points`), district, and keyword search, showing capacity statuses (`OPEN AVAILABLE`, `NEAR CAPACITY`, `FULL`, `TEMPORARILY CLOSED`, `UNKNOWN`), supplies, landmarks, and click-to-call buttons.
- **Emergency Helplines:** Click-to-call cards for `112`, `1070`, `1077`, `108`, `101`, and `NDRF Control Room`.
- **Multilingual Safety Guides:** Offline-ready **Before / During / After** checklists for **Flood Safety**, **Landslide Safety**, and **Earthquake Safety**.

### 6. Relief Operations (`/ngo`) & Coordinator Desk (`/coordinator`)
- **Relief Operations Dashboard (`/ngo`):** Protected for authenticated `NGO_MEMBER`, `VOLUNTEER`, `COORDINATOR`, and `ADMIN` roles. Supports priority-sorted verified assistance requests, task pledges (`PLEDGED` → `EN_ROUTE` → `ON_SITE` → `RELIEF_DELIVERED`), volunteer availability, and field inventory.
- **Coordinator Desk (`/coordinator`):** Protected exclusively for `COORDINATOR` and `ADMIN` roles. Separates **Verification Status** (`UNVERIFIED`, `UNDER REVIEW`, `VERIFIED`, `REJECTED`) from **Assistance Workflow** (`SUBMITTED`, `ACCEPTED`, `DISPATCHED`, `RESOLVED`), manages corridors/resources, and logs audit history.

### 7. Multilingual Support & Dual Theme
- **4 Languages:** Global language selector supporting **English (default)**, **Assamese (অসমীয়া)**, **Hindi (हिन्दी)**, and **Bengali (বাংলা)** across the Role Selection portal, navigation, pages, controls, and Safety Guides, persisted in `localStorage`.
- **Dark & Light Themes:** Deep navy/slate dark theme (default) and high-contrast light theme toggleable across all screens.
- **Offline Simulation Mode:** Built-in **Simulate Offline** control in the sidebar to test offline queuing, Outbox retries, and map tile fallback without disconnecting your network.

---

## Architecture & Project Structure

UI components are decoupled from storage via a `dataService` facade (`DataAdapter` interface) and `authService` (`Supabase Auth` + `organization_profiles` RBAC + separated Demo Mode), allowing zero-config local execution or full Supabase Postgres + Auth operation.

```text
docs/
└── AUTH_SETUP.md       # Supabase Auth + organization_profiles RBAC provisioning guide
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
└── main.tsx            # Application entry point
```

---

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router (`react-router-dom`)
- **Backend / Auth (Optional):** Supabase Postgres + Row Level Security + Supabase Auth
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** Lucide React (`lucide-react`)
- **Maps:** Leaflet (`leaflet`) + OpenStreetMap tiles (with offline directory fallback)

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation & Development

```bash
# Install dependencies
npm install

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

When evaluating **Organization Login** (`/login`) in **DEMO MODE** (or when provisioned in Supabase Auth + `public.organization_profiles`), the following role assignments apply:

| Demo account | Role | Access Scope |
| --- | --- | --- |
| `demo.ngo@northeastconnect.demo` | `NGO_MEMBER` | Relief Operations Dashboard (`/ngo`); blocked from Coordinator Desk (`/coordinator`). |
| `demo.volunteer@northeastconnect.demo` | `VOLUNTEER` | Relief Operations Dashboard (`/ngo`); blocked from Coordinator Desk (`/coordinator`). |
| `demo.coordinator@northeastconnect.demo` | `COORDINATOR` | Coordinator Desk (`/coordinator`) and Relief Operations Dashboard (`/ngo`). |

---

## Demo Walkthrough Tips

1. **Role Selection (`/`) & Language Switching:** Open `/` to choose **Continue as Citizen** (`/board`) or **Organization Login** (`/login`). Switch languages across **English**, **অসমীয়া**, **हिन्दी**, and **বাংলা**.
2. **Test RBAC Separation:** On `/login`, launch the clearly badged **`DEMO MODE`** account `demo.ngo@northeastconnect.demo` (`NGO_MEMBER`). Verify `/ngo` opens Relief Operations, and navigating to `/coordinator` displays **Access Denied — Insufficient Clearance**. Sign out and switch to `demo.coordinator@northeastconnect.demo` (`COORDINATOR`) to unlock `/coordinator`.
3. **Test Offline-First Queuing:** Toggle **Simulate Offline** in the sidebar, submit a Quick SOS or 3-step report on `/report`, observe `"Saved on your device. Not yet sent."`, open **My Outbox** to test **Share via SMS**, then go online and click **Sync Queued**.
