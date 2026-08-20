import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.recommendation import haversine_km, recommend
from services.dispatch import validate_dispatch, build_dispatch_events


def make_unit(id="UNIT-1", name=None, caps=("medical",), status="AVAILABLE", workload=0, lat=21.0, lon=79.0):
    return {
        "id": id,
        "name": name or id,
        "agencyId": "AGY-1",
        "type": "AMBULANCE",
        "capabilities": list(caps),
        "status": status,
        "workload": workload,
        "latitude": lat,
        "longitude": lon,
    }


def make_incident(req=("medical",), severity="HIGH", lat=21.0, lon=79.0, status="REPORTED"):
    return {
        "id": "INC-1",
        "title": "Test incident",
        "type": "FLOOD",
        "severity": severity,
        "status": status,
        "latitude": lat,
        "longitude": lon,
        "requiredCapabilities": list(req),
    }


def test_closest_unit_wins_when_all_else_equal():
    inc = make_incident(lat=21.0, lon=79.0)
    near = make_unit("UNIT-NEAR", lat=21.005, lon=79.0)
    far = make_unit("UNIT-FAR", lat=21.07, lon=79.0)
    result = recommend(inc, [far, near])
    assert result["recommendations"][0]["unitId"] == "UNIT-NEAR"


def test_far_capable_unit_beats_nearby_incapable():
    inc = make_incident(req=("urban_search_rescue", "medical"), lat=21.0, lon=79.0)
    nearby_ambulance = make_unit("UNIT-A", caps=("medical",), lat=21.018, lon=79.0)
    far_rescue = make_unit("UNIT-B", caps=("urban_search_rescue", "medical"), lat=21.036, lon=79.0)
    result = recommend(inc, [nearby_ambulance, far_rescue])
    assert result["recommendations"][0]["unitId"] == "UNIT-B"
    assert any(e["unitId"] == "UNIT-A" for e in result["excluded"])


def test_offline_units_excluded():
    inc = make_incident()
    offline = make_unit("UNIT-OFF", status="OFFLINE")
    result = recommend(inc, [offline])
    assert result["recommendations"] == []
    assert result["excluded"][0]["unitId"] == "UNIT-OFF"


def test_busy_units_excluded():
    inc = make_incident()
    busy = make_unit("UNIT-BUSY", status="BUSY")
    result = recommend(inc, [busy])
    assert result["recommendations"] == []


def test_missing_capability_excluded():
    inc = make_incident(req=("flood_rescue",))
    incapable = make_unit("UNIT-X", caps=("medical",))
    result = recommend(inc, [incapable])
    assert result["recommendations"] == []
    assert "flood_rescue" in result["excluded"][0]["reason"]


def test_lower_workload_ranks_higher():
    inc = make_incident(lat=21.0, lon=79.0)
    free = make_unit("UNIT-FREE", workload=0, lat=21.01, lon=79.0)
    loaded = make_unit("UNIT-LOADED", workload=3, lat=21.01, lon=79.0)
    result = recommend(inc, [loaded, free])
    assert result["recommendations"][0]["unitId"] == "UNIT-FREE"
    assert result["recommendations"][0]["score"] > result["recommendations"][1]["score"]


def test_higher_incident_priority_increases_score():
    unit = make_unit("UNIT-1")
    low = recommend(make_incident(severity="LOW"), [unit])["recommendations"][0]["score"]
    critical = recommend(make_incident(severity="CRITICAL"), [unit])["recommendations"][0]["score"]
    assert critical > low


def test_dispatch_revalidates_unit_availability():
    inc = make_incident()
    unit = make_unit("UNIT-004", name="Ambulance 04")
    assert validate_dispatch(inc, ["UNIT-004"], {"UNIT-004": unit}) == []
    unit["status"] = "BUSY"
    errors = validate_dispatch(inc, ["UNIT-004"], {"UNIT-004": unit})
    assert errors[0]["code"] == "UNIT_UNAVAILABLE"
    assert "no longer available" in errors[0]["message"]


def test_dispatching_unavailable_unit_fails():
    inc = make_incident()
    unit = make_unit("UNIT-009", status="OFFLINE")
    errors = validate_dispatch(inc, ["UNIT-009"], {"UNIT-009": unit})
    assert len(errors) == 1
    assert errors[0]["code"] == "UNIT_UNAVAILABLE"


def test_dispatch_events_created():
    inc = make_incident()
    units = [make_unit("UNIT-1"), make_unit("UNIT-2")]
    events = build_dispatch_events(inc, units)
    assert len(events) == 6
    types = {e["type"] for e in events}
    assert {"UNIT_ASSIGNED", "UNIT_DISPATCHED", "UNIT_EN_ROUTE"} <= types
    assert all(e["incidentId"] == "INC-1" for e in events)


def test_haversine_distance_accuracy():
    assert haversine_km(21.0, 79.0, 21.0, 79.0) == 0
    km = haversine_km(21.0, 79.0, 22.0, 79.0)
    assert abs(km - 111.2) < 1.5
