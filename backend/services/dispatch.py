from config import ACTIVE_INCIDENT_STATUSES
from services.recommendation import missing_capabilities


def validate_dispatch(incident, unit_ids, units_by_id, assigned_unit_ids=None):
    assigned = set(assigned_unit_ids or [])
    errors = []
    if incident is None:
        return [{"code": "INCIDENT_NOT_FOUND", "message": "Incident does not exist."}]
    if incident["status"] not in ACTIVE_INCIDENT_STATUSES:
        errors.append(
            {
                "code": "INCIDENT_NOT_ACTIVE",
                "message": f"Incident {incident['id']} is {incident['status']} and cannot accept dispatch.",
            }
        )
    for unit_id in unit_ids:
        unit = units_by_id.get(unit_id)
        if unit is None:
            errors.append(
                {"code": "UNIT_NOT_FOUND", "message": f"{unit_id} does not exist.", "unitId": unit_id}
            )
            continue
        if unit["status"] != "AVAILABLE":
            errors.append(
                {
                    "code": "UNIT_UNAVAILABLE",
                    "message": f"{unit['name']} is no longer available.",
                    "unitId": unit_id,
                }
            )
            continue
        missing = missing_capabilities(unit, incident)
        if missing:
            errors.append(
                {
                    "code": "CAPABILITY_MISMATCH",
                    "message": f"{unit['name']} lacks required capabilities: {', '.join(missing)}.",
                    "unitId": unit_id,
                }
            )
            continue
        if unit_id in assigned:
            errors.append(
                {
                    "code": "UNIT_ALREADY_ASSIGNED",
                    "message": f"{unit['name']} is already assigned to another active incident.",
                    "unitId": unit_id,
                }
            )
    return errors


def build_dispatch_events(incident, units):
    events = []
    for unit in units:
        for event_type, description in [
            ("UNIT_ASSIGNED", f"{unit['name']} assigned to incident {incident['id']}"),
            ("UNIT_DISPATCHED", f"{unit['name']} dispatched by operator"),
            ("UNIT_EN_ROUTE", f"{unit['name']} en route to {incident['title']}"),
        ]:
            events.append(
                {
                    "incidentId": incident["id"],
                    "type": event_type,
                    "description": description,
                    "metadata": {"unitId": unit["id"], "unitName": unit["name"]},
                }
            )
    return events
