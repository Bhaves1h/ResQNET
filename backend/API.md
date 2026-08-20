# ResQNet API Reference

Base URL: `{REACT_APP_BACKEND_URL}/api`. All errors return `{"error": {"code", "message", "details?"}}`.
Role authorization is header-based (demo architecture, no login): send `X-Role: ADMIN|DISPATCHER|AGENCY_OPERATOR|FIELD_RESPONDER`. Default: DISPATCHER.

## Health
- GET `/api/` → service status

## Agencies
- GET `/api/agencies` — list
- GET `/api/agencies/{id}` — detail

## Units
- GET `/api/units?status=&agencyId=` — list
- GET `/api/units/{id}` — detail
- PATCH `/api/units/{id}/status` — body `{status, workload?}`; roles: ADMIN, DISPATCHER, AGENCY_OPERATOR, FIELD_RESPONDER. Updates active assignment + logs UNIT_EN_ROUTE / UNIT_ARRIVED / UNIT_COMPLETED events.

## Incidents
- POST `/api/incidents` — roles: ADMIN, DISPATCHER. Body: `{title, type, severity, latitude, longitude, description?, peopleAffected?, requiredCapabilities[]}`
- GET `/api/incidents?status=` — list
- GET `/api/incidents/{id}` — detail + current assignments
- PATCH `/api/incidents/{id}/status` — roles: ADMIN, DISPATCHER. Logs INCIDENT_ASSESSED / INCIDENT_RESOLVED.
- GET `/api/incidents/{id}/events` — audit timeline

## Recommendations
- GET `/api/incidents/{id}/recommendations` — ranked units: `{unitId, unitName, score, distanceKm, etaMinutes, status, workload, matchedCapabilities, factors, reasons}` + excluded units with reasons. Logs UNIT_RECOMMENDED events.

## Dispatch
- POST `/api/incidents/{id}/dispatch` — roles: ADMIN, DISPATCHER. Body `{unitIds[]}`. Revalidates availability/capability/assignment at dispatch time; creates incident-unit assignments, sets units EN_ROUTE, incident → RESPONDING, logs UNIT_ASSIGNED / UNIT_DISPATCHED / UNIT_EN_ROUTE. Returns updated incident state.

## Scoring
`score = 0.35*capability + 0.20*availability + 0.20*distance + 0.15*workload + 0.10*incident_priority` (see `config.py`). Capability + availability + workload are hard eligibility filters before ranking. ETA = distance / 30 km/h (estimate, not traffic-aware).

## Seed & tests
- `cd backend && python seed.py` (idempotent; wipes and reseeds demo data)
- `cd backend && python -m pytest tests/ -v`
