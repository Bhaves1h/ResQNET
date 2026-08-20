import math

from config import (
    RESPONSE_WEIGHTS,
    SEVERITY_SCORES,
    DISTANCE_BANDS,
    AVG_RESPONSE_SPEED_KMH,
    ELIGIBLE_UNIT_STATUSES,
    MAX_WORKLOAD,
    RECOMMENDATION_LIMIT,
)


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


def distance_score(km):
    for max_km, score in DISTANCE_BANDS:
        if km <= max_km:
            return score
    return DISTANCE_BANDS[-1][1]


def workload_score(workload):
    return max(0, 100 - int(workload) * 25)


def eta_minutes(km):
    return km / AVG_RESPONSE_SPEED_KMH * 60.0


def missing_capabilities(unit, incident):
    return [c for c in incident["requiredCapabilities"] if c not in unit["capabilities"]]


def eligibility_failure(unit, incident, busy_unit_ids=None):
    if unit["status"] not in ELIGIBLE_UNIT_STATUSES:
        return f"{unit['name']} is {unit['status'].replace('_', ' ').lower()}"
    if busy_unit_ids and unit["id"] in busy_unit_ids:
        return f"{unit['name']} is already assigned to an active incident"
    missing = missing_capabilities(unit, incident)
    if missing:
        return f"{unit['name']} lacks required capabilities: {', '.join(missing)}"
    if unit.get("workload", 0) > MAX_WORKLOAD:
        return f"{unit['name']} is at critical workload"
    return None


def _workload_reason(workload):
    return {
        0: "No current workload",
        1: "Low current workload",
        2: "Moderate current workload",
        3: "High current workload",
    }.get(workload, "Critical workload")


def score_unit(unit, incident):
    km = haversine_km(
        incident["latitude"], incident["longitude"], unit["latitude"], unit["longitude"]
    )
    matched = [c for c in incident["requiredCapabilities"] if c in unit["capabilities"]]
    factors = {
        "capability": 100.0 * len(matched) / max(1, len(incident["requiredCapabilities"])),
        "availability": 100.0 if unit["status"] == "AVAILABLE" else 40.0,
        "distance": float(distance_score(km)),
        "workload": float(workload_score(unit.get("workload", 0))),
        "incident_priority": float(SEVERITY_SCORES[incident["severity"]]),
    }
    total = round(sum(factors[k] * RESPONSE_WEIGHTS[k] for k in factors), 1)
    return {
        "unitId": unit["id"],
        "unitName": unit["name"],
        "unitType": unit.get("type"),
        "agencyId": unit.get("agencyId"),
        "score": total,
        "distanceKm": round(km, 1),
        "etaMinutes": round(eta_minutes(km)),
        "status": unit["status"],
        "workload": unit.get("workload", 0),
        "matchedCapabilities": matched,
        "factors": {k: round(v, 1) for k, v in factors.items()},
        "reasons": [
            f"Required capabilities matched: {', '.join(matched)}",
            "Currently available",
            f"{round(km, 1)} km from incident",
            _workload_reason(unit.get("workload", 0)),
            f"{incident['severity']} incident priority",
        ],
    }


def recommend(incident, units, busy_unit_ids=None, limit=RECOMMENDATION_LIMIT):
    busy = set(busy_unit_ids or [])
    scored, excluded = [], []
    for unit in units:
        failure = eligibility_failure(unit, incident, busy)
        if failure:
            excluded.append(
                {"unitId": unit["id"], "unitName": unit["name"], "reason": failure}
            )
            continue
        scored.append(score_unit(unit, incident))
    scored.sort(key=lambda r: (-r["score"], r["distanceKm"]))
    return {
        "incidentId": incident["id"],
        "recommendations": scored[:limit],
        "excluded": excluded,
    }
