RESPONSE_WEIGHTS = {
    "capability": 0.35,
    "availability": 0.20,
    "distance": 0.20,
    "workload": 0.15,
    "incident_priority": 0.10,
}

SEVERITY_SCORES = {
    "LOW": 25,
    "MODERATE": 50,
    "HIGH": 75,
    "CRITICAL": 100,
}

# (max_km, score) — closer suitable units score higher; configurable
DISTANCE_BANDS = [
    (2.0, 100),
    (5.0, 85),
    (10.0, 65),
    (20.0, 40),
    (float("inf"), 15),
]

AVG_RESPONSE_SPEED_KMH = 30.0
ELIGIBLE_UNIT_STATUSES = {"AVAILABLE"}
MAX_WORKLOAD = 3
RECOMMENDATION_LIMIT = 5

ACTIVE_INCIDENT_STATUSES = {"REPORTED", "ASSESSING", "RESPONDING", "ON_SCENE", "CONTROLLED"}
ACTIVE_ASSIGNMENT_STATUSES = {"RECOMMENDED", "ASSIGNED", "DISPATCHED", "EN_ROUTE", "ON_SCENE"}

UNIT_STATUS_EVENT_MAP = {
    "EN_ROUTE": "UNIT_EN_ROUTE",
    "ON_SCENE": "UNIT_ARRIVED",
    "COMPLETED": "UNIT_COMPLETED",
}

INCIDENT_STATUS_EVENT_MAP = {
    "ASSESSING": "INCIDENT_ASSESSED",
    "RESOLVED": "INCIDENT_RESOLVED",
}

ROLES = {"ADMIN", "DISPATCHER", "AGENCY_OPERATOR", "FIELD_RESPONDER"}

# ---- User-facing incident reporting ----
# Minimal, guaranteed-matchable core capability per incident type (hard filter safe).
INCIDENT_CAPABILITY_MAP = {
    "FIRE": ["firefighting"],
    "MEDICAL": ["medical"],
    "ROAD_ACCIDENT": ["medical"],
    "FLOOD": ["flood_rescue"],
    "BUILDING_COLLAPSE": ["urban_search_rescue"],
    "EARTHQUAKE": ["urban_search_rescue"],
    "MISSING_PERSON": ["search"],
    "HAZMAT": ["hazmat"],
    "OTHER": ["rescue"],
}

INCIDENT_SEVERITY_MAP = {
    "FIRE": "HIGH",
    "MEDICAL": "MODERATE",
    "ROAD_ACCIDENT": "MODERATE",
    "FLOOD": "CRITICAL",
    "BUILDING_COLLAPSE": "HIGH",
    "EARTHQUAKE": "CRITICAL",
    "MISSING_PERSON": "LOW",
    "HAZMAT": "HIGH",
    "OTHER": "MODERATE",
}

INCIDENT_TYPE_LABELS = {
    "FIRE": "Fire",
    "MEDICAL": "Medical Emergency",
    "ROAD_ACCIDENT": "Road Accident",
    "FLOOD": "Flood",
    "BUILDING_COLLAPSE": "Building Collapse",
    "EARTHQUAKE": "Earthquake",
    "MISSING_PERSON": "Missing Person",
    "HAZMAT": "Chemical / Hazmat",
    "OTHER": "Emergency",
}

# Agency-type keys the user can request (match agency.type in seed data).
AGENCY_TYPES = {"fire", "medical", "police", "disaster_response", "rescue"}

ACTIVE_INCIDENT_RESPONSE_STATUSES = {"ACCEPTED", "RESPONDING", "ON_SCENE"}
