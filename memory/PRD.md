# RESQNET — PRD

## Original Problem Statement
RESQNET: a disaster-management app helping rescue agencies coordinate. Phase 1 (done): liquid-glass landing page per exact design prompt. Phase 2 (this session): explainable recommendation engine backend (5-factor scoring, dispatch revalidation, Nagpur seed data), Command Center dispatcher console, and full-screen menu overlay — per the detailed backend spec (agencies/units/incidents/incident-units/incident-events, hard capability eligibility, weighted scoring, audit events, role-based access architecture).

## User Personas
- DISPATCHER: creates incidents, views recommendations, dispatches units
- AGENCY_OPERATOR: manages own unit availability
- FIELD_RESPONDER: updates assigned unit status
- ADMIN: manages everything

## Architecture
- Backend: FastAPI + Motor (MongoDB), modular: `config.py` (weights/bands/constants), `services/recommendation.py` (haversine, eligibility, scoring — pure functions), `services/dispatch.py` (validate_dispatch, build_dispatch_events — pure), `models.py` (pydantic), `seed.py`, `tests/test_recommendation.py`, `API.md`
- Frontend: React; `/` landing (TopBar/Hero/Marquee/Manifesto/Footer/ScrollHint), `/command` RoleSelect, `/command/user` UserCommandCenter, `/command/agency` AgencyCommandCenter. Shared: `components/command/` (MapView[react-leaflet], CommandNav, AddIncidentSheet, UserStatusCard, AgencyIncidentPanel, AgencyUnitsPanel), `lib/command.js` (API, config, local role/reporter helpers).
- Auth: header-based role architecture (`X-Role`), no login per spec; demo role switcher in Command Center header
- String IDs (INC-0001, UNIT-012, AGY-01); all Mongo reads exclude `_id`; timestamps ISO strings

## Scoring Formula
score = 0.35*capability + 0.20*availability + 0.20*distance + 0.15*workload + 0.10*incident_priority
- Hard filters BEFORE ranking: status AVAILABLE, all required capabilities, workload ≤ 3, not already assigned
- Severity: LOW 25 / MODERATE 50 / HIGH 75 / CRITICAL 100; distance bands 0-2km→100, 2-5→85, 5-10→65, 10-20→40, 20+→15; workload 0-4 → 100/75/50/25/0; ETA = km / 30 km/h (estimate only, not traffic-aware)

## Implemented (2026-08-21) — Command Center v2 (User + Agency map experience)
- **Frictionless role selection** at `/command` ("How are you responding?" → I need help / I'm an agency). No login (per spec). Role + reporterId stored in localStorage; agency stores {id,name,type,lat,lng}.
- **USER Command Center** (`/command/user`): full-screen dark Leaflet map (CartoDB dark tiles, no API key), "Add incident" FAB → 3-step glass sheet (type → location [Use my location / Select on map with movable pin] → agencies needed + optional description → Report). After reporting, incident pins on map + live status card (Response Requested → Confirmed → units EN ROUTE/ON SCENE with ETA). "My Incidents" list.
- **AGENCY Command Center** (`/command/agency`): same map; sees incidents where its agency type is requested; incident detail panel → Accept Response → agency-scoped recommendation (score/distance/ETA/capability/workload + Best match) → select units → Dispatch. "My Units" panel with per-unit status control (AVAILABLE/EN_ROUTE/ON_SCENE/COMPLETED). Agency header with ONLINE badge.
- **MacBook-style floating nav** (`CommandNav`) role-aware; LIVE indicator + exit.
- Backend additions: `POST /api/incidents/report` (public citizen report, derives requiredCapabilities+severity from type), `GET /api/incidents?reporterId=`, `GET /api/agencies/{id}/incidents`, `POST /api/incidents/{id}/accept` (incident_responses collection), recommendations `?agencyId=` filter, dispatch allows AGENCY_OPERATOR with `X-Agency-Id` ownership guard (403 on foreign units). Seed incidents now carry `requestedAgencies`.
- Removed old dispatcher console + unused auth scaffold (auth.py/errors.py/auth.js/Join.jsx/old command components).
- Tested: 37/37 pytest (new `tests/test_command_center.py` + existing), full Playwright E2E of user + agency + cross-role flow (0 console errors).

## Implemented (2026-08-21) — Landing page refresh
- Removed all landing buttons (Explore Now, socials, account, feature plus) and the Menu overlay; single CTA remains ("Enter Command Center" in footer).
- Added MacBook-style floating **TopBar** (Home / Manifesto / Network + Command Center pill).
- Added floating **ScrollHint** ("Scroll down to enter the Command Center") that fades near the footer.
- Brand text changed **resqnet → ResQNET** across landing + command surfaces. Footer given `id="network"`.

## Implemented (2026-08-20) — earlier
- Phase 1: landing page (video hero, liquid glass, marquee, manifesto, lenis, framer-motion)
- Phase 2: full backend — agencies/units/incidents CRUD-lite, recommendations endpoint with explainable scores + reasons + exclusions, dispatch with revalidation (UNIT_UNAVAILABLE/ CAPABILITY_MISMATCH/UNIT_ALREADY_ASSIGNED/INCIDENT_NOT_ACTIVE), incident-unit assignments, event timeline (INCIDENT_CREATED, UNIT_RECOMMENDED, UNIT_ASSIGNED, UNIT_DISPATCHED, UNIT_EN_ROUTE, UNIT_ARRIVED, UNIT_COMPLETED, INCIDENT_ASSESSED, INCIDENT_RESOLVED), consistent error format, role guards
- Seed: 10 agencies, 36 units, 6 incidents (Nagpur; CRITICAL Ward 14 flood demo)
- 11 pytest unit tests — all passing
- Command Center: incident list, generate recommendations (top 3 preselected), one-click dispatch, timeline, unit status panel, role switcher, 10s polling
- Menu overlay: full-screen glass nav with links to Home/Manifesto/Command Center/Network
- Verified: curl chain (health, agencies, units, incidents, recommendations, dispatch success + 409 revalidation + 403 role, unit status, create incident), UI screenshots of full dispatch flow and menu overlay, pytest 11/11

## Backlog
### Known issues (from E2E test iteration_1) — not yet fixed
- Incident ID uses `count_documents+1` (not race-safe; concurrent reports can collide). Move to uuid or atomic counter + unique index. (P1)
- Dispatch ownership guard only enforced when `X-Agency-Id` header present; add server-side agency resolution. (P1)
- sonner Toaster (top-center) overlaps the floating command nav during a toast. Reposition toaster or nav. (P2)
### P1
- Realtime push (WebSockets) instead of 8-10s polling
- Incident resolution / close-out controls (user + agency)
### P2
- Real road-routing ETA, traffic, historical response data
- Real auth (JWT/OAuth) if multi-tenant separation is needed beyond demo

## Next Tasks
1. Fix race-safe incident IDs + dispatch guard hardening
2. Realtime updates (WebSocket) to replace polling
3. Incident resolution controls
