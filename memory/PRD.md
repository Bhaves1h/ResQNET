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
- Frontend: React; `/` landing (Hero/Marquee/Manifesto/Footer/MenuOverlay), `/command` Command Center (IncidentList, RecommendationPanel, Timeline, UnitsPanel)
- Auth: header-based role architecture (`X-Role`), no login per spec; demo role switcher in Command Center header
- String IDs (INC-0001, UNIT-012, AGY-01); all Mongo reads exclude `_id`; timestamps ISO strings

## Scoring Formula
score = 0.35*capability + 0.20*availability + 0.20*distance + 0.15*workload + 0.10*incident_priority
- Hard filters BEFORE ranking: status AVAILABLE, all required capabilities, workload ≤ 3, not already assigned
- Severity: LOW 25 / MODERATE 50 / HIGH 75 / CRITICAL 100; distance bands 0-2km→100, 2-5→85, 5-10→65, 10-20→40, 20+→15; workload 0-4 → 100/75/50/25/0; ETA = km / 30 km/h (estimate only, not traffic-aware)

## Implemented (2026-08-20)
- Phase 1: landing page (video hero, liquid glass, marquee, manifesto, lenis, framer-motion)
- Phase 2: full backend — agencies/units/incidents CRUD-lite, recommendations endpoint with explainable scores + reasons + exclusions, dispatch with revalidation (UNIT_UNAVAILABLE/ CAPABILITY_MISMATCH/UNIT_ALREADY_ASSIGNED/INCIDENT_NOT_ACTIVE), incident-unit assignments, event timeline (INCIDENT_CREATED, UNIT_RECOMMENDED, UNIT_ASSIGNED, UNIT_DISPATCHED, UNIT_EN_ROUTE, UNIT_ARRIVED, UNIT_COMPLETED, INCIDENT_ASSESSED, INCIDENT_RESOLVED), consistent error format, role guards
- Seed: 10 agencies, 36 units, 6 incidents (Nagpur; CRITICAL Ward 14 flood demo)
- 11 pytest unit tests — all passing
- Command Center: incident list, generate recommendations (top 3 preselected), one-click dispatch, timeline, unit status panel, role switcher, 10s polling
- Menu overlay: full-screen glass nav with links to Home/Manifesto/Command Center/Network
- Verified: curl chain (health, agencies, units, incidents, recommendations, dispatch success + 409 revalidation + 403 role, unit status, create incident), UI screenshots of full dispatch flow and menu overlay, pytest 11/11

## Backlog
### P1
- Realtime push (WebSockets/Supabase Realtime) instead of 10s polling
- Incident creation form in Command Center UI (API exists)
- Resolve/close incident flow in UI (API exists)
### P2
- Real road-routing ETA, traffic, historical response data
- Live map view of Nagpur units/incidents
- Official RESQNET logo swap
- Real auth (JWT/OAuth) replacing X-Role header

## Next Tasks
1. Incident creation + resolution controls in Command Center UI
2. WebSocket realtime updates
3. Map view
