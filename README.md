# Northeast Connect

**Stay Informed. Stay Connected. Stay Prepared.**

Northeast Connect is an offline-first, community-driven disaster management and emergency coordination web application designed for Northeast India (Hackathon Project — PS05). It helps residents, travelers, volunteers, and emergency coordinators monitor flood and landslide advisories, track lifeline highway/bridge/ferry passability, submit hazard or urgent rescue requests while offline, and coordinate field response.

> **Prototype & Demo Data Notice:** This prototype runs locally with realistic **Sample Demo Data** across Northeast Indian districts. All sample records are explicitly badged as `Sample Demo Data`, and simulated offline/SMS features clearly disclose their boundaries (e.g., *"Opens your SMS app. We cannot confirm delivery."*).

---

## Core Features

### 1. Situation Board (`/`)
- **Permanent 112 Emergency Strip:** Clickable `tel:112` call action and quick link to **Request Urgent Help**.
- **Situation Overview:** Live-filtered statistics for Active Advisories, Blocked Corridors, Open Help Requests, and Available Resources across 10+ Northeast districts.
- **Disaster Advisories:** Severity-coded bulletins (`CRITICAL`, `WARNING`, `WATCH`) showing instructions, issued/expiry timestamps, source attribution, verification state, and stale-data warnings.
- **Lifeline Corridor Board:** Searchable and filterable status board (`PASSABLE`, `SINGLE LANE`, `LANDSLIDE BLOCKED`, `SUBMERGED`, `CLOSED`, `UNKNOWN`) rendered as a table on desktop and cards on mobile.
- **Interactive Regional Map:** Built with **Leaflet** and **OpenStreetMap** featuring layer filters (`Incidents`, `Corridors`, `Camps & Medical`), custom markers, popups, legend, and automatic/manual fallback to a structured **Offline Location Directory** when offline or if map tiles fail to load.
- **Community Reports Feed:** Searchable incident cards with vulnerability/assistance details and interactive **+1 Confirm** endorsement counts.

### 2. Report / Request Help (`/report`)
- **Dual Mode:** Choose **Report a Hazard** or **Request Urgent Help**.
- **3-Step Guided Form:**
  1. **Location:** District, Block/Highway Corridor, Locality/Landmark, optional browser GPS coordinate capture, and *"I am reporting for others"* toggle.
  2. **Situation & Needs:** Category, severity level, affected people count, vulnerability tags (`Elderly`, `Infants`, `Pregnant`, `Medical Need`, `Disabled`), and assistance needs (`Rescue`, `Medical`, `Food / Water`, `Shelter`).
  3. **Contact & Review:** Inline phone/reporter validation and pre-submission summary.
- **Offline-First Confirmation:** When offline (or using the **Simulate Offline** toggle), submissions display *"Saved on your device. Not yet sent."* and are queued in **My Outbox**.

### 3. My Outbox (Slide-Over Drawer)
- Tracks `Pending`, `Syncing`, `Synced`, and `Failed` submissions stored locally on the device.
- Supports **Retry**, **Sync Queued**, **Edit** (re-opens in the 3-step form), **Delete** (with confirmation dialog), and **Share via SMS** (`sms:?body=...` URI with explicit delivery disclaimer).

### 4. Resources, Helplines & Safety Guides (`/resources`)
- **Resource Directory:** Filterable by category (`Relief Camps`, `Medical Posts`, `Water / Ration Points`, `Boat Rescue Points`), district, and keyword search, showing capacity statuses (`OPEN AVAILABLE`, `NEAR CAPACITY`, `FULL`, `TEMPORARILY CLOSED`, `UNKNOWN`), supplies, landmarks, and click-to-call buttons.
- **Emergency Helplines:** Click-to-call cards for `112`, `1070`, `1077`, `108`, `101`, and `NDRF Control Room`.
- **Multilingual Safety Guides:** Offline-ready **Before / During / After** checklists for **Flood Safety**, **Landslide Safety**, and **Earthquake Safety**.

### 5. Coordinator Desk (`/coordinator`)
- **Demo PIN Gate:** Accessible with Demo PIN **`2468`** (includes a one-click *Fill Demo PIN* helper for demonstrations).
- **Report Inbox & Triage:** Filter by district, report type, and verification status. Visually separates **Verification Status** (`UNVERIFIED`, `UNDER REVIEW`, `VERIFIED`, `REJECTED`) from **Assistance Workflow** (`SUBMITTED`, `ACCEPTED`, `DISPATCHED`, `RESOLVED`).
- **Response Management:** Assign response units (`SDRF`, `NDRF`, `PWD`, Medical teams), log timestamped internal coordinator notes, and merge duplicate reports with confirmation dialogs.
- **Corridor & Resource Controls:** Update highway passability and shelter/medical post capacity in real time across the app.
- **Activity / Audit History:** Tracks every coordinator action and includes a **Reset Demo Data** option.

### 6. Multilingual Support & Dual Theme
- **4 Languages:** Global language selector supporting **English (default)**, **Assamese (অসমীয়া)**, **Hindi (हिन्दी)**, and **Bengali (বাংলা)** across navigation, pages, controls, and Safety Guides, persisted in `localStorage`.
- **Dark & Light Themes:** Deep navy/slate dark theme (default) and high-contrast light theme toggleable from the sidebar or mobile header.
- **Offline Simulation Mode:** Built-in **Simulate Offline** control in the sidebar/header to test offline queuing, Outbox retries, and map tile fallback without disconnecting your network.

---

## Architecture & Project Structure

UI components are decoupled from storage via a `dataService` facade (`DataAdapter` interface), allowing the local prototype adapter (`LocalAdapter`) to be swapped for a backend adapter (`SupabaseAdapter`) without modifying UI components.

```text
src/
├── components/         # Reusable UI components (AppLayout, EmergencyStrip, OfflineBanner,
│                       # TrustBadge, SeverityBadge, StatusPill, IncidentCard, CorridorCard,
│                       # ResourceCard, OutboxDrawer, InteractiveMap, ConfirmationDialog, etc.)
├── context/            # AppContext (theme, language, district, connectivity, state actions)
├── data/               # Sample Northeast India demo records, translations, & safety guides
├── pages/              # SituationBoardPage, ReportHelpPage, ResourcesGuidesPage, CoordinatorDeskPage
├── services/           # dataAdapter.ts, localAdapter.ts, supabaseAdapter.ts, dataService.ts
├── types/              # TypeScript domain interfaces and union types
├── utils/              # Timestamp formatters, staleness checks, and SMS payload builder
├── App.tsx             # React Router routes and root providers
├── index.css           # Tailwind CSS v4 configuration, dark variant, fonts, and Leaflet styles
└── main.tsx            # Application entry point
```

---

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router (`react-router-dom`)
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

## Demo Walkthrough Tips

1. **Test Language Switching:** Use the language dropdown in the top header to switch between **English**, **অসমীয়া**, **हिन्दी**, and **বাংলা**.
2. **Test Offline-First Queuing:** Click **Simulate Offline** in the sidebar (or **Online/Offline** pill on mobile), submit a help request on `/report`, observe `"Saved on your device. Not yet sent."`, open **My Outbox** to inspect **Share via SMS** or **Retry**, then go back online and click **Sync Queued**.
3. **Test Coordinator Triage:** Visit **Coordinator Desk** (`/coordinator`), enter PIN **`2468`** (or click **Fill Demo PIN**), verify/dispatch a report, or change a highway corridor status and see it reflect immediately on the **Situation Board**.
