"""Backend tests for ResQNet Command Center (citizen report + agency response flows)."""
import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

AGENCY_ID = "AGY-04"  # disaster_response
RESOLVE_AGENCY_ID = "AGY-02"  # medical — isolated from AGENCY_ID to avoid unit-pool races with TestDispatch
FOREIGN_UNIT = "UNIT-001"  # AGY-01


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def reporter_id():
    return f"qa-reporter-{uuid.uuid4().hex[:6]}"


@pytest.fixture(scope="module")
def flood_incident(client, reporter_id):
    payload = {
        "type": "FLOOD",
        "latitude": 21.1245,
        "longitude": 79.0630,
        "description": "TEST_ qa flood",
        "requestedAgencies": ["disaster_response", "medical"],
        "reporterId": reporter_id,
    }
    r = client.post(f"{API}/incidents/report", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


# ---- health ----
def test_root_health(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---- POST /api/incidents/report ----
class TestReportIncident:
    def test_report_creates_incident_with_derived_fields(self, flood_incident, reporter_id):
        d = flood_incident
        assert d["id"].startswith("INC-")
        assert d["type"] == "FLOOD"
        assert d["severity"] == "CRITICAL"
        assert d["requiredCapabilities"] == ["flood_rescue"]
        assert d["requestedAgencies"] == ["disaster_response", "medical"]
        assert d["status"] == "REPORTED"
        assert d["reporterId"] == reporter_id
        assert d["source"] == "CITIZEN"
        assert "_id" not in d

    def test_report_persisted_and_fetchable(self, client, flood_incident):
        r = client.get(f"{API}/incidents/{flood_incident['id']}")
        assert r.status_code == 200
        d = r.json()
        assert d["severity"] == "CRITICAL"
        assert isinstance(d["assignments"], list)
        assert isinstance(d["responses"], list)

    def test_report_creates_event(self, client, flood_incident):
        r = client.get(f"{API}/incidents/{flood_incident['id']}/events")
        assert r.status_code == 200
        types = [e["type"] for e in r.json()]
        assert "INCIDENT_CREATED" in types

    def test_report_requires_agency(self, client, reporter_id):
        r = client.post(f"{API}/incidents/report", json={
            "type": "FIRE", "latitude": 21.1, "longitude": 79.0,
            "requestedAgencies": [], "reporterId": reporter_id,
        })
        assert r.status_code == 422
        assert "error" in r.json()

    def test_report_invalid_type(self, client, reporter_id):
        r = client.post(f"{API}/incidents/report", json={
            "type": "ALIEN_INVASION", "latitude": 21.1, "longitude": 79.0,
            "requestedAgencies": ["fire"], "reporterId": reporter_id,
        })
        assert r.status_code == 422

    def test_report_invalid_latitude(self, client, reporter_id):
        r = client.post(f"{API}/incidents/report", json={
            "type": "FIRE", "latitude": 200, "longitude": 79.0,
            "requestedAgencies": ["fire"], "reporterId": reporter_id,
        })
        assert r.status_code == 422

    def test_severity_map_medical(self, client, reporter_id):
        r = client.post(f"{API}/incidents/report", json={
            "type": "MEDICAL", "latitude": 21.14, "longitude": 79.08,
            "requestedAgencies": ["medical"], "reporterId": reporter_id + "-med",
        })
        assert r.status_code == 201
        d = r.json()
        assert d["severity"] == "MODERATE"
        assert d["requiredCapabilities"] == ["medical"]


# ---- GET /api/incidents?reporterId= ----
class TestListByReporter:
    def test_filter_by_reporter(self, client, flood_incident, reporter_id):
        r = client.get(f"{API}/incidents", params={"reporterId": reporter_id})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(i["reporterId"] == reporter_id for i in data)
        assert flood_incident["id"] in [i["id"] for i in data]

    def test_unknown_reporter_empty(self, client):
        r = client.get(f"{API}/incidents", params={"reporterId": "no-such-reporter-xyz"})
        assert r.status_code == 200
        assert r.json() == []


# ---- GET /api/agencies/{id}/incidents ----
class TestAgencyIncidents:
    def test_agency_sees_relevant_incident(self, client, flood_incident):
        r = client.get(f"{API}/agencies/{AGENCY_ID}/incidents")
        assert r.status_code == 200
        data = r.json()
        ids = [i["id"] for i in data]
        assert flood_incident["id"] in ids
        for inc in data:
            assert isinstance(inc.get("responses"), list)

    def test_agency_does_not_see_unrequested(self, client, reporter_id):
        r = client.post(f"{API}/incidents/report", json={
            "type": "FIRE", "latitude": 21.15, "longitude": 79.09,
            "requestedAgencies": ["fire"], "reporterId": reporter_id + "-fire",
        })
        assert r.status_code == 201
        fire_id = r.json()["id"]
        r2 = client.get(f"{API}/agencies/{AGENCY_ID}/incidents")
        assert fire_id not in [i["id"] for i in r2.json()]

    def test_unknown_agency_404(self, client):
        r = client.get(f"{API}/agencies/AGY-999/incidents")
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "AGENCY_NOT_FOUND"


# ---- GET recommendations (agency scoped) ----
class TestRecommendations:
    def test_agency_scoped_ranked(self, client, flood_incident):
        r = client.get(f"{API}/incidents/{flood_incident['id']}/recommendations",
                       params={"agencyId": AGENCY_ID})
        assert r.status_code == 200
        recs = r.json()["recommendations"]
        assert len(recs) >= 1
        for rec in recs:
            assert set(["unitId", "unitName", "score", "distanceKm", "etaMinutes",
                        "matchedCapabilities"]).issubset(rec.keys())
            assert "flood_rescue" in rec["matchedCapabilities"]
        scores = [x["score"] for x in recs]
        assert scores == sorted(scores, reverse=True)
        # all units belong to AGY-04
        units = client.get(f"{API}/units", params={"agencyId": AGENCY_ID}).json()
        agency_unit_ids = {u["id"] for u in units}
        assert all(rec["unitId"] in agency_unit_ids for rec in recs)

    def test_capability_hard_filter(self, client, flood_incident):
        r = client.get(f"{API}/incidents/{flood_incident['id']}/recommendations")
        assert r.status_code == 200
        for rec in r.json()["recommendations"]:
            assert "flood_rescue" in rec["matchedCapabilities"]

    def test_recommendations_unknown_incident(self, client):
        r = client.get(f"{API}/incidents/INC-9999/recommendations")
        assert r.status_code == 404


# ---- accept ----
@pytest.fixture(scope="class")
def accept_incident_fx(client):
    """Dedicated incident so parallel dispatch tests don't mutate its status."""
    r = client.post(f"{API}/incidents/report", json={
        "type": "FLOOD", "latitude": 21.1240, "longitude": 79.0625,
        "description": "TEST_ accept flow",
        "requestedAgencies": ["disaster_response"],
        "reporterId": f"qa-accept-{uuid.uuid4().hex[:6]}",
    })
    assert r.status_code == 201, r.text
    return r.json()


class TestAccept:
    def test_accept_and_idempotency(self, client, accept_incident_fx):
        flood_incident = accept_incident_fx
        iid = flood_incident["id"]
        h = {"X-Role": "AGENCY_OPERATOR"}
        r = client.post(f"{API}/incidents/{iid}/accept", json={"agencyId": AGENCY_ID}, headers=h)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "ACCEPTED"
        assert d["agencyId"] == AGENCY_ID
        assert d["agencyType"] == "disaster_response"
        # incident transitioned
        inc = client.get(f"{API}/incidents/{iid}").json()
        assert inc["status"] == "ASSESSING"
        assert any(res["agencyId"] == AGENCY_ID for res in inc["responses"])
        # idempotent
        r2 = client.post(f"{API}/incidents/{iid}/accept", json={"agencyId": AGENCY_ID}, headers=h)
        assert r2.status_code == 200
        assert r2.json()["id"] == d["id"]
        assert len(client.get(f"{API}/incidents/{iid}").json()["responses"]) == 1

    def test_accept_unknown_agency(self, client, accept_incident_fx):
        flood_incident = accept_incident_fx
        r = client.post(f"{API}/incidents/{flood_incident['id']}/accept",
                        json={"agencyId": "AGY-999"}, headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 404

    def test_accept_role_guard(self, client, accept_incident_fx):
        flood_incident = accept_incident_fx
        r = client.post(f"{API}/incidents/{flood_incident['id']}/accept",
                        json={"agencyId": AGENCY_ID}, headers={"X-Role": "FIELD_RESPONDER"})
        assert r.status_code == 403
        assert r.json()["error"]["code"] == "FORBIDDEN"


# ---- dispatch ----
class TestDispatch:
    def test_dispatch_foreign_unit_forbidden(self, client, flood_incident):
        r = client.post(
            f"{API}/incidents/{flood_incident['id']}/dispatch",
            json={"unitIds": [FOREIGN_UNIT]},
            headers={"X-Role": "AGENCY_OPERATOR", "X-Agency-Id": AGENCY_ID},
        )
        assert r.status_code == 403, r.text
        assert r.json()["error"]["code"] == "FORBIDDEN"
        unit = client.get(f"{API}/units/{FOREIGN_UNIT}").json()
        assert unit["status"] != "EN_ROUTE"

    def test_dispatch_own_unit(self, client, flood_incident):
        iid = flood_incident["id"]
        recs = client.get(f"{API}/incidents/{iid}/recommendations",
                          params={"agencyId": AGENCY_ID}).json()["recommendations"]
        unit_id = recs[0]["unitId"]
        r = client.post(
            f"{API}/incidents/{iid}/dispatch",
            json={"unitIds": [unit_id]},
            headers={"X-Role": "AGENCY_OPERATOR", "X-Agency-Id": AGENCY_ID},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["incident"]["status"] == "RESPONDING"
        assert d["assignments"][0]["unitId"] == unit_id
        assert d["assignments"][0]["status"] == "DISPATCHED"
        assert client.get(f"{API}/units/{unit_id}").json()["status"] == "EN_ROUTE"
        pytest.dispatched_unit = unit_id

    def test_dispatch_busy_unit_conflict(self, client, flood_incident):
        unit_id = getattr(pytest, "dispatched_unit", None)
        assert unit_id, "previous dispatch test must run first"
        r = client.post(
            f"{API}/incidents/{flood_incident['id']}/dispatch",
            json={"unitIds": [unit_id]},
            headers={"X-Role": "AGENCY_OPERATOR", "X-Agency-Id": AGENCY_ID},
        )
        assert r.status_code == 409, r.text

    def test_dispatch_empty_unitids(self, client, flood_incident):
        r = client.post(
            f"{API}/incidents/{flood_incident['id']}/dispatch",
            json={"unitIds": []},
            headers={"X-Role": "AGENCY_OPERATOR", "X-Agency-Id": AGENCY_ID},
        )
        assert r.status_code == 422

    def test_patch_status_on_scene_creates_event(self, client, flood_incident):
        # Kept in this class (not TestUnitStatus) so loadscope pins it to the same
        # worker as test_dispatch_own_unit, which sets pytest.dispatched_unit.
        unit_id = getattr(pytest, "dispatched_unit", None)
        assert unit_id
        r = client.patch(f"{API}/units/{unit_id}/status", json={"status": "ON_SCENE"},
                         headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "ON_SCENE"
        assert client.get(f"{API}/units/{unit_id}").json()["status"] == "ON_SCENE"
        events = client.get(f"{API}/incidents/{flood_incident['id']}/events").json()
        assert "UNIT_ARRIVED" in [e["type"] for e in events]


# ---- unit status ----
class TestUnitStatus:
    def test_patch_invalid_status(self, client):
        unit_id = getattr(pytest, "dispatched_unit", "UNIT-012")
        r = client.patch(f"{API}/units/{unit_id}/status", json={"status": "NAPPING"},
                         headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 422

    def test_patch_unknown_unit(self, client):
        r = client.patch(f"{API}/units/UNIT-XXX/status", json={"status": "AVAILABLE"},
                         headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 404


# ---- resolve ----
@pytest.fixture(scope="class")
def resolve_incident_fx(client):
    """Dedicated incident + agency, dispatched + on-scene, ready for resolve tests."""
    r = client.post(f"{API}/incidents/report", json={
        "type": "MEDICAL", "latitude": 21.1355, "longitude": 79.0616,
        "description": "TEST_ resolve flow",
        "requestedAgencies": ["medical"],
        "reporterId": f"qa-resolve-{uuid.uuid4().hex[:6]}",
    })
    assert r.status_code == 201, r.text
    incident = r.json()
    iid = incident["id"]
    h = {"X-Role": "AGENCY_OPERATOR"}
    client.post(f"{API}/incidents/{iid}/accept", json={"agencyId": RESOLVE_AGENCY_ID}, headers=h)
    recs = client.get(f"{API}/incidents/{iid}/recommendations",
                      params={"agencyId": RESOLVE_AGENCY_ID}).json()["recommendations"]
    unit_id = recs[0]["unitId"]
    d = client.post(
        f"{API}/incidents/{iid}/dispatch",
        json={"unitIds": [unit_id]},
        headers={"X-Role": "AGENCY_OPERATOR", "X-Agency-Id": RESOLVE_AGENCY_ID},
    )
    assert d.status_code == 200, d.text
    return {"incident_id": iid, "unit_id": unit_id}


class TestResolve:
    def test_resolve_blocked_when_not_active(self, client):
        r = client.post(f"{API}/incidents/report", json={
            "type": "FIRE", "latitude": 21.11, "longitude": 79.05,
            "requestedAgencies": ["fire"],
            "reporterId": f"qa-resolve-blocked-{uuid.uuid4().hex[:6]}",
        })
        assert r.status_code == 201, r.text
        iid = r.json()["id"]
        rr = client.post(f"{API}/incidents/{iid}/resolve", headers={"X-Role": "AGENCY_OPERATOR"})
        assert rr.status_code == 409
        assert rr.json()["error"]["code"] == "INCIDENT_NOT_RESOLVABLE"

    def test_on_scene_auto_transitions_incident(self, client, resolve_incident_fx):
        iid = resolve_incident_fx["incident_id"]
        unit_id = resolve_incident_fx["unit_id"]
        inc = client.get(f"{API}/incidents/{iid}").json()
        assert inc["status"] == "RESPONDING"
        r = client.patch(f"{API}/units/{unit_id}/status", json={"status": "ON_SCENE"},
                         headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 200, r.text
        inc = client.get(f"{API}/incidents/{iid}").json()
        assert inc["status"] == "ON_SCENE"
        events = client.get(f"{API}/incidents/{iid}/events").json()
        assert "INCIDENT_ON_SCENE" in [e["type"] for e in events]

    def test_resolve_returns_unit_to_available(self, client, resolve_incident_fx):
        iid = resolve_incident_fx["incident_id"]
        unit_id = resolve_incident_fx["unit_id"]
        r = client.post(f"{API}/incidents/{iid}/resolve", headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 200, r.text
        inc = r.json()
        assert inc["status"] == "RESOLVED"
        assert inc["resolvedAt"] is not None
        assert client.get(f"{API}/units/{unit_id}").json()["status"] == "AVAILABLE"
        events = client.get(f"{API}/incidents/{iid}/events").json()
        types = [e["type"] for e in events]
        assert "INCIDENT_RESOLVED" in types
        assert "UNIT_COMPLETED" in types

    def test_resolve_already_resolved_conflict(self, client, resolve_incident_fx):
        iid = resolve_incident_fx["incident_id"]
        r = client.post(f"{API}/incidents/{iid}/resolve", headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "INCIDENT_NOT_RESOLVABLE"

    def test_resolve_unknown_incident(self, client):
        r = client.post(f"{API}/incidents/INC-9999/resolve", headers={"X-Role": "AGENCY_OPERATOR"})
        assert r.status_code == 404
